import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Cursor from './components/Cursor';
import { PageLoader, ScrollToTop } from './components/ui';
import { AuthProvider, useAuth } from './store/auth';
import { CartProvider } from './store/cart';
import { Mark } from './components/Logo';
import { ToastProvider } from './store/toast';
import { ContentProvider, useContent } from './store/content';

import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmed from './pages/OrderConfirmed';
import TrackOrder from './pages/TrackOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import Search from './pages/Search';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import SizeGuide from './pages/SizeGuide';
import Policy from './pages/Policy';
import NotFound from './pages/NotFound';

// The admin panel is a separate bundle — shoppers never download it.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const ProductEditor = lazy(() => import('./pages/admin/ProductEditor'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'));
const AdminStock = lazy(() => import('./pages/admin/Stock'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminInbox = lazy(() => import('./pages/admin/Inbox'));
const AdminContentIndex = lazy(() => import('./pages/admin/Content').then((m) => ({ default: m.ContentIndex })));
const AdminContentEditor = lazy(() => import('./pages/admin/Content'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers').then((m) => ({ default: m.CustomersList })));
const AdminCustomerDetail = lazy(() => import('./pages/admin/Customers'));
const AdminMedia = lazy(() => import('./pages/admin/Media'));
const AdminMediaUpload = lazy(() => import('./pages/admin/MediaUpload'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminProfile = lazy(() => import('./pages/admin/Profile'));

function RequireAuth({ children, admin = false }) {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();

  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

/**
 * The storefront closed, with the panel still reachable.
 *
 * Signing in has to stay open or an admin who is not already signed in could
 * not get back to the switch that reopens the shop.
 */
function Closed({ title, body }) {
  return (
    <div className="shell flex min-h-screen flex-col items-center justify-center py-20 text-center">
      <Mark className="h-12 w-auto text-mist" />
      <h1 className="mt-8 font-display text-xl font-semibold uppercase tracking-wider2 text-navy">{title}</h1>
      <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-slate">{body}</p>
    </div>
  );
}

function Storefront() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const { maintenance } = useContent('settings');
  const { isAdmin: signedInAsAdmin } = useAuth();

  const closed = maintenance?.on === true
    && !isAdmin
    && !signedInAsAdmin
    && pathname !== '/login';

  if (closed) return <Closed title={maintenance.title} body={maintenance.body} />;

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductEditor />} />
            <Route path="products/:id" element={<ProductEditor />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="inbox" element={<AdminInbox />} />
            <Route path="content" element={<AdminContentIndex />} />
            <Route path="content/:key" element={<AdminContentEditor />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="media/new" element={<AdminMediaUpload />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/search" element={<Search />} />

          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:orderNumber" element={<OrderConfirmed />} />
          <Route path="/track-order" element={<TrackOrder />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="/account/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/shipping" element={<Policy kind="shipping" />} />
          <Route path="/returns" element={<Policy kind="returns" />} />
          <Route path="/privacy" element={<Policy kind="privacy" />} />
          <Route path="/terms" element={<Policy kind="terms" />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <Cursor />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ContentProvider>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Storefront />
          </CartProvider>
        </AuthProvider>
      </ContentProvider>
    </ToastProvider>
  );
}

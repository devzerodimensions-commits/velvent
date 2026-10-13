import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import { PageLoader, ScrollToTop } from './components/ui';
import { AuthProvider, useAuth } from './store/auth';
import { CartProvider } from './store/cart';
import { ToastProvider } from './store/toast';

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
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminInbox = lazy(() => import('./pages/admin/Inbox'));

function RequireAuth({ children, admin = false }) {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();

  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function Storefront() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

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
            <Route path="categories" element={<AdminCategories />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="inbox" element={<AdminInbox />} />
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
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Storefront />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

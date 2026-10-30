import { toWebp } from './image';

const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'velvent.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

/** Thrown for any non-2xx response; `fields` carries per-input messages when the API sends them. */
export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || null;
  }
}

async function request(path, { method = 'GET', body, headers = {}, raw } = {}) {
  const token = getToken();
  const init = {
    method,
    headers: {
      ...(raw ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  if (body !== undefined) init.body = raw ? body : JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401 && token) setToken(null);
    throw new ApiError(data?.error || `Request failed (${res.status}).`, res.status, data?.errors);
  }
  return data;
}

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) {
      s.set(k, Array.isArray(v) ? v.join(',') : v);
    }
  });
  const str = s.toString();
  return str ? `?${str}` : '';
};

export const api = {
  health: () => request('/health'),

  content: () => request('/content'),

  categories: () => request('/categories'),
  products: (params) => request(`/products${qs(params)}`),
  filters: () => request('/products/filters'),
  product: (slug) => request(`/products/${slug}`),
  addReview: (slug, body) => request(`/products/${slug}/reviews`, { method: 'POST', body }),

  priceCart: (items, couponCode) => request('/cart/price', { method: 'POST', body: { items, couponCode } }),
  coupon: (code) => request(`/coupons/${encodeURIComponent(code)}`),
  offers: () => request('/offers'),
  paymentMethods: () => request('/payment-methods'),

  placeOrder: (body) => request('/orders', { method: 'POST', body }),
  verifyPayment: (orderNumber, body) => request(`/orders/${orderNumber}/verify`, { method: 'POST', body }),
  myOrders: () => request('/orders'),
  order: (orderNumber, email) => request(`/orders/${orderNumber}${qs({ email })}`),
  cancelOrder: (orderNumber) => request(`/orders/${orderNumber}/cancel`, { method: 'POST' }),

  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PUT', body }),
  changePassword: (body) => request('/auth/me/password', { method: 'PUT', body }),

  addresses: () => request('/auth/addresses'),
  addAddress: (body) => request('/auth/addresses', { method: 'POST', body }),
  deleteAddress: (id) => request(`/auth/addresses/${id}`, { method: 'DELETE' }),

  wishlist: () => request('/auth/wishlist'),
  addWishlist: (id) => request(`/auth/wishlist/${id}`, { method: 'POST' }),
  removeWishlist: (id) => request(`/auth/wishlist/${id}`, { method: 'DELETE' }),

  newsletter: (email) => request('/newsletter', { method: 'POST', body: { email } }),
  contact: (body) => request('/contact', { method: 'POST', body }),

  admin: {
    stats: () => request('/admin/stats'),
    products: (q) => request(`/admin/products${qs({ q })}`),
    product: (id) => request(`/admin/products/${id}`),
    createProduct: (body) => request('/admin/products', { method: 'POST', body }),
    updateProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PUT', body }),
    patchProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PATCH', body }),
    deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
    setStock: (id, stock) => request(`/admin/variants/${id}/stock`, { method: 'PUT', body: { stock } }),

    categories: () => request('/admin/categories'),
    createCategory: (body) => request('/admin/categories', { method: 'POST', body }),
    updateCategory: (id, body) => request(`/admin/categories/${id}`, { method: 'PUT', body }),
    deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),

    orders: (status) => request(`/admin/orders${qs({ status })}`),
    setOrderStatus: (id, body) => request(`/admin/orders/${id}/status`, { method: 'PUT', body }),
    order: (id) => request(`/admin/orders/${id}`),
    setOrderNote: (id, admin_note) => request(`/admin/orders/${id}/note`, { method: 'PUT', body: { admin_note } }),

    stock: (q) => request(`/admin/stock${qs({ q })}`),
    saveStock: (updates) => request('/admin/stock', { method: 'PUT', body: { updates } }),

    shippingProviders: () => request('/admin/shipping/providers'),
    shipOrder: (id, body) => request(`/admin/orders/${id}/shipment`, { method: 'PUT', body }),
    shipOrders: (shipments) => request('/admin/orders/shipments', { method: 'PUT', body: { shipments } }),

    messages: () => request('/admin/messages'),
    readMessage: (id) => request(`/admin/messages/${id}/read`, { method: 'PUT' }),
    subscribers: () => request('/admin/subscribers'),

    coupons: () => request('/admin/coupons'),
    saveCoupon: (body) => request('/admin/coupons', { method: 'POST', body }),
    deleteCoupon: (id) => request(`/admin/coupons/${id}`, { method: 'DELETE' }),

    content: () => request('/admin/content'),
    saveContent: (key, value) => request(`/admin/content/${key}`, { method: 'PUT', body: { value } }),
    resetContent: (key) => request(`/admin/content/${key}`, { method: 'DELETE' }),

    users: (q) => request(`/admin/users${qs({ q })}`),
    createUser: (body) => request('/admin/users', { method: 'POST', body }),
    updateUser: (id, body) => request(`/admin/users/${id}`, { method: 'PUT', body }),
    setUserPassword: (id, password) => request(`/admin/users/${id}/password`, { method: 'PUT', body: { password } }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

    customers: (q) => request(`/admin/customers${qs({ q })}`),
    customer: (id) => request(`/admin/customers/${id}`),
    updateCustomer: (id, body) => request(`/admin/customers/${id}`, { method: 'PUT', body }),

    media: () => request('/admin/media'),
    deleteMedia: (id) => request(`/admin/media/${id}`, { method: 'DELETE' }),

    /**
     * Every upload in the admin goes through here, so the conversion to WebP
     * happens once rather than at each place that happens to take a file.
     */
    upload: async (file) => {
      const web = await toWebp(file);
      const fd = new FormData();
      fd.append('file', web);
      return request('/admin/media', { method: 'POST', body: fd, raw: true });
    },
  },
};

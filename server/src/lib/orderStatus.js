/**
 * Order statuses, following WooCommerce.
 *
 * WooCommerce ships seven core statuses. "shipped" is not one of them — Woo
 * treats a parcel as done the moment it is fulfilled — but a clothing store
 * needs to tell a customer their parcel is on its way, and adding a custom
 * status is standard practice in Woo stores. So the seven core ones are here
 * unchanged, with "shipped" sitting between processing and completed.
 */
export const ORDER_STATUSES = {
  pending: {
    label: 'Pending payment',
    description: 'Order received, no payment yet.',
    customer: 'Awaiting payment',
  },
  processing: {
    label: 'Processing',
    description: 'Payment received (or COD accepted) and the order is being prepared.',
    customer: 'Confirmed',
  },
  'on-hold': {
    label: 'On hold',
    description: 'Waiting on payment confirmation or stock.',
    customer: 'On hold',
  },
  shipped: {
    label: 'Shipped',
    description: 'Handed to the courier.',
    customer: 'Shipped',
  },
  completed: {
    label: 'Completed',
    description: 'Delivered and finished. Nothing further to do.',
    customer: 'Delivered',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Cancelled by the customer or an admin. Stock was returned.',
    customer: 'Cancelled',
  },
  refunded: {
    label: 'Refunded',
    description: 'Money returned to the customer.',
    customer: 'Refunded',
  },
  failed: {
    label: 'Failed',
    description: 'Payment failed or was declined.',
    customer: 'Payment failed',
  },
};

export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUSES);

/** The statuses a customer may still cancel from — nothing has shipped yet. */
export const CANCELLABLE = ['pending', 'processing', 'on-hold'];

/** Orders the shop still has to act on. Drives the dashboard counter. */
export const NEEDS_ACTION = ['pending', 'processing', 'on-hold'];

/** Statuses that no longer hold stock, so cancelling must not return it twice. */
export const STOCK_ALREADY_RETURNED = ['cancelled', 'refunded'];

export const isOrderStatus = (value) => ORDER_STATUS_KEYS.includes(value);

/** What a brand-new order starts as, following WooCommerce's own rule. */
export const initialStatus = (paymentMethod) =>
  (paymentMethod === 'cod' ? 'processing' : 'pending');

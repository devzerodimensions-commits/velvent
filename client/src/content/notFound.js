/** The page someone lands on when a link has gone stale. */
export const defaults = {
  code: '404',
  title: 'This page does not exist',
  body: 'The link may be old, or the piece you were after is no longer listed.',
  primaryLabel: 'Back home',
  primaryTo: '/',
  secondaryLabel: 'Shop the collection',
  secondaryTo: '/shop',
};

export const fields = [
  { name: 'code', label: 'Large number', type: 'text' },
  { name: 'title', label: 'Heading', type: 'text' },
  { name: 'body', label: 'Text', type: 'textarea' },
  { name: 'primaryLabel', label: 'First button', type: 'text' },
  { name: 'primaryTo', label: 'First button links to', type: 'text' },
  { name: 'secondaryLabel', label: 'Second button', type: 'text' },
  { name: 'secondaryTo', label: 'Second button links to', type: 'text' },
];

/** The Contact page's copy and the subject list on its form. */
export const defaults = {
  title: 'Contact Us',
  intro: 'Questions about sizing, an order, or a bulk enquiry — we are a small team and we answer every message ourselves.',
  formTitle: 'Send a message',
  subjects: [
    'General enquiry',
    'Order status',
    'Returns or exchange',
    'Size and fit',
    'Bulk or corporate order',
    'Feedback',
  ],
};

export const fields = [
  { name: 'title', label: 'Page heading', type: 'text' },
  { name: 'intro', label: 'Intro', type: 'textarea' },
  { name: 'formTitle', label: 'Form heading', type: 'text' },
  {
    name: 'subjects',
    label: 'Subject options',
    type: 'strings',
    itemLabel: 'Subject',
    help: 'What a visitor can pick from when sending a message.',
  },
];

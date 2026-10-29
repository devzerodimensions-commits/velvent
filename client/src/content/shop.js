/** The shop listing, its filters, and the search page. */
export const defaults = {
  title: 'Shop All',
  intro: '',

  sortLabel: 'Sort products',
  filtersLabel: 'Filters',
  clearLabel: 'Clear filters',

  emptyTitle: 'Nothing matches those filters',
  emptyBody: 'Try widening your selection, or browse the full collection.',

  search: {
    placeholder: 'Try ‘polo’, ‘oversized’ or ‘navy’',
    idleTitle: 'What are you looking for?',
    idleBody: 'Search by product name, category or colour.',
    idleCtaLabel: 'Browse everything',
    emptyBody: 'Check the spelling, or browse the full collection instead.',
  },
};

export const fields = [
  { name: 'title', label: 'Page heading', type: 'text', help: 'Used when browsing everything. A category page uses the category name.' },
  { name: 'intro', label: 'Intro', type: 'textarea', help: 'Optional. Leave empty for no intro line.' },

  { name: 'emptyTitle', label: 'No results heading', type: 'text' },
  { name: 'emptyBody', label: 'No results text', type: 'textarea' },
  { name: 'clearLabel', label: 'Clear filters button', type: 'text' },
  { name: 'filtersLabel', label: 'Filters heading', type: 'text' },
  { name: 'sortLabel', label: 'Sort label', type: 'text', help: 'Read out by screen readers; not shown on screen.' },

  {
    name: 'search',
    label: 'Search page',
    type: 'group',
    fields: [
      { name: 'placeholder', label: 'Search box placeholder', type: 'text' },
      { name: 'idleTitle', label: 'Before searching, heading', type: 'text' },
      { name: 'idleBody', label: 'Before searching, text', type: 'textarea' },
      { name: 'idleCtaLabel', label: 'Before searching, button', type: 'text' },
      { name: 'emptyBody', label: 'No results text', type: 'textarea' },
    ],
  },
];

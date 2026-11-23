/**
 * What the settings panel offers for sections, columns, and the styling that
 * every widget shares.
 *
 * Widget-specific fields live beside their widget in registry.jsx. These are
 * the ones that would otherwise be repeated on all of them.
 */

const BACKGROUND = [
  { name: 'bgType', label: 'Background', type: 'select', options: [['none', 'None'], ['color', 'Colour'], ['image', 'Image']] },
  { name: 'bgColor', label: 'Colour', type: 'color', when: (s) => s.bgType === 'color' || s.bgType === 'image' },
  { name: 'bgImage', label: 'Image', type: 'image', when: (s) => s.bgType === 'image' },
  { name: 'bgSize', label: 'Fit', type: 'select', when: (s) => s.bgType === 'image', options: [['cover', 'Fill the area'], ['contain', 'Fit inside'], ['auto', 'Original size']] },
  { name: 'bgPosition', label: 'Position', type: 'select', when: (s) => s.bgType === 'image', options: [['center', 'Centre'], ['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']] },
  { name: 'bgRepeat', label: 'Repeat', type: 'select', when: (s) => s.bgType === 'image', options: [['no-repeat', 'No'], ['repeat', 'Tile'], ['repeat-x', 'Across'], ['repeat-y', 'Down']] },
  { name: 'bgAttachment', label: 'Scroll with page', type: 'select', when: (s) => s.bgType === 'image', options: [['scroll', 'Yes'], ['fixed', 'No — hold still']] },
];

const BORDER = [
  { name: 'borderWidth', label: 'Border width (px)', type: 'spacing', responsive: true },
  { name: 'borderStyle', label: 'Border style', type: 'select', options: [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted']] },
  { name: 'borderColor', label: 'Border colour', type: 'color' },
  { name: 'radius', label: 'Corner radius (px)', type: 'spacing', responsive: true },
];

const SPACING = [
  { name: 'padding', label: 'Padding (px)', type: 'spacing', responsive: true, help: 'Space inside the edge.' },
  { name: 'margin', label: 'Margin (px)', type: 'spacing', responsive: true, help: 'Space outside the edge.' },
];

export const SECTION_SCHEMA = {
  layout: [
    { name: 'contentWidth', label: 'Content width', type: 'select', responsive: true, options: [['boxed', 'Boxed'], ['full', 'Full width']] },
    { name: 'maxWidth', label: 'Max width (px)', type: 'number', responsive: true, when: (s) => (s.contentWidth?.d ?? s.contentWidth ?? 'boxed') === 'boxed' },
    { name: 'minHeight', label: 'Minimum height (px)', type: 'number', responsive: true },
    { name: 'gap', label: 'Gap between columns (px)', type: 'number', responsive: true },
    { name: 'align', label: 'Align columns', type: 'select', responsive: true, options: [['stretch', 'Same height'], ['flex-start', 'Top'], ['center', 'Middle'], ['flex-end', 'Bottom']] },
  ],
  style: [...BACKGROUND, { name: 'color', label: 'Text colour', type: 'color' }, ...BORDER],
  advanced: SPACING,
};

export const COLUMN_SCHEMA = {
  layout: [
    { name: 'width', label: 'Width (%)', type: 'number', responsive: true, help: 'Leave empty to share the row evenly. Columns stack on mobile whatever this says.' },
    { name: 'align', label: 'Align content', type: 'select', responsive: true, options: [['flex-start', 'Top'], ['center', 'Middle'], ['flex-end', 'Bottom'], ['space-between', 'Spread out']] },
  ],
  style: [...BACKGROUND, { name: 'color', label: 'Text colour', type: 'color' }, ...BORDER],
  advanced: SPACING,
};

/** Styling every widget gets, on top of whatever its own entry declares. */
export const WIDGET_COMMON = {
  style: [
    { name: 'align', label: 'Align', type: 'align', responsive: true },
    ...BACKGROUND,
    ...BORDER,
  ],
  advanced: [
    ...SPACING,
    { name: 'hide', label: 'Hide on this device', type: 'toggle', responsive: true, onLabel: 'Hidden', help: 'Switch to Tablet or Mobile above, then tick to hide it only there.' },
  ],
};

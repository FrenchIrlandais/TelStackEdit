const origin = `${window.location.protocol}//${window.location.host}`;

// TODO delete this file ?

export default {
  cleanTrashAfter: 7 * 24 * 60 * 60 * 1000, // 7 days
  origin,
  types: [
    'fileInfo',
    'folder',
    'data',
  ],
  textMaxLength: 250000,
  defaultName: 'Untitled',
};

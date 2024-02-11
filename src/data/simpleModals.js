const simpleModal = (contentHtml, rejectText, resolveText) => ({
  contentHtml: typeof contentHtml === 'function' ? contentHtml : () => contentHtml,
  rejectText,
  resolveText,
});

export default {
  folderDeletion: simpleModal( // TODO changer ? on ne peut pas supprimer un folder non vide (et les folder vide osef avec git)
    config => `<p>You are about to delete the folder <b>${config.item.name}</b>. Its files will be moved to Trash. Are you sure?</p>`,
    'No',
    'Yes, delete',
  ),
  stripName: simpleModal(
    config => `<p><b>${config.item.name}</b> contains illegal characters. Do you want to strip them?</p>`,
    'No',
    'Yes, strip',
  ),
  trashDeletion: simpleModal(
    '<p>Files in the trash are automatically deleted after 7 days of inactivity.</p>',
    'Ok',
  ),
};

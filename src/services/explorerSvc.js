import store from '../store';
import workspaceSvc from './workspaceSvc';

export default {
  newItem(isFolder = false) {
    let parentId = store.getters['explorer/selectedNodeFolder'].item.id;

    // Not allowed to create new items in the trash, move it in '/'
    if (parentId === 'trash') {
      parentId = null;
    }

    store.dispatch('explorer/openNode', parentId);
    store.commit('explorer/setNewItem', {
      type: isFolder ? 'folder' : 'file',
      parentId,
    });
  },

  async deleteItem() {
    const selectedNode = store.getters['explorer/selectedNode'];
    if (selectedNode.isNil) {
      return;
    }

    // Files in trash and 'trash' folder cannot be deleted :: TODO est-ce qu'on garde ce fonctionnement ?
    if (selectedNode.isTrash || selectedNode.item.parentId === 'trash') {
      try {
        await store.dispatch('modal/open', 'trashDeletion');
      } catch (e) {
        // Cancel
      }
      return; // Don't do anything.
    }

    // See if we have a confirmation dialog to show
    let moveToTrash = true;
    try {
      if (selectedNode.isFolder) {
        await store.dispatch('modal/open', {
          type: 'folderDeletion',
          item: selectedNode.item,
        });
      }
    } catch (e) {
      return; // cancel
    }

    const deleteFile = (id) => {
      if (moveToTrash) { // TODO: mettre un mecanisme de cleaning de trash?
        // TODo changer tout ça, en vrai la suppression je la gere comment ?
        workspaceSvc.moveFile(id, 'trash'); // move
      } else {
        workspaceSvc.deleteFile(id);
      }
    };

    if (selectedNode === store.getters['explorer/selectedNode']) {
      const currentFileId = store.getters['fileInfo/current'].id;
      let doClose = selectedNode.item.id === currentFileId;
      if (selectedNode.isFolder) {
        const recursiveDelete = (folderNode) => {
          folderNode.folders.forEach(recursiveDelete);
          folderNode.files.forEach((fileNode) => {
            doClose = doClose || fileNode.item.id === currentFileId;
            deleteFile(fileNode.item.id);
          });
          store.commit('folder/deleteItem', folderNode.item.id);
        };
        recursiveDelete(selectedNode);
      } else {
        deleteFile(selectedNode.item.id);
      }
      if (doClose) {
        // Close the current file by opening the last opened, not deleted one
        store.getters['data/lastOpenedIds'].some((id) => {
          const file = store.state.fileInfo.itemsById[id];
          if (file.parentId === 'trash') {
            return false;
          }
          store.commit('fileInfo/setCurrentId', id);
          return true;
        });
      }
    }
  },
};

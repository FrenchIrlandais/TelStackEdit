// TODO intro / import ?

/**
* Service contenant les différents constructors de l'objet FolderInfo
*/


function emptyFolderInfoConstructor(id) {
  return {
    id: id,
    type: 'folder',
    name: '',
    parentId: null,
    hash: 0,
  };
}

/**
* TreeFolder est l'objet que l'on reçoit du serveur dans la description de l'arbre (Tree) du Root Repository
*/
function folderInfoFromTreeFolder(treeFolder){
  return {
    id: treeFolder.guid,
    type: 'folder',
    name: treeFolder.name,
    parentId: treeFolder.parentGuid,
    hash: treeFolder.hash, // TODO il se passe quoi ?
  };
}

// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  emptyFolderInfoConstructor,
  folderInfoFromTreeFolder
};

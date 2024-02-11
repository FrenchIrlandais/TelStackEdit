// TODO intro / import ?

/**
* Service contenant les différents constructors de l'objet FileInfo
*/


function emptyFileInfoConstructor(id) {
  return {
    id: id,
    type: 'fileInfo',
    name: '',
    parentId: null,
    selectionStart: 0,
    selectionEnd: 0,
    scrollPosition: null,
    hash: 0,
  };
}

/**
* TreeFile est l'objet que l'on reçoit du serveur dans la description de l'arbre (Tree) du Root Repository
*/
function fileInfoFromTreeFile(treeFile){
  return {
    id: treeFile.guid,
    type: 'fileInfo', // TODO delete ?
    name: treeFile.name,
    parentId: treeFile.parentGuid,
    selectionStart: 0,
    selectionEnd: 0,
    scrollPosition: null,
    hash: treeFile.hash, // TODO il se passe quoi ?
  };
}


// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  emptyFileInfoConstructor,
  fileInfoFromTreeFile
};

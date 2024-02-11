import store from '../store';
import rootRepositorySvc from './rootRepositorySvc';
import fileInfoSvc from '../services/fileInfoSvc';
import folderInfoSvc from '../services/folderInfoSvc';
import utils from './utils';
import constants from '../data/constants';

/**
* Le service Workspace permet de gérer les files & folders qui sont dans le store.
*/
// -----------------------------------------------------------------------------
// -- Constants
// --
const TEMP_FILES_GUID_REGEX = /^~(.*)$/g;

// -----------------------------------------------------------------------------
// -- File & Folder manipulation
// --
/**
* Create a file in the store with the specified fields.
*/
// TODO need to be surrounded by try catch ..
// TODO ne pas retourner l'item, juste son ID, eviter l'appel useless a store.state.fileInfo.itemsById[id] ...
async function createFile(name, parentId) {
  const id = utils.uid();
  const item = {
    id,
    name: utils.sanitizeFilename(name),
    parentId: parentId || null,
  };

  // If name is being stripped
  if (item.name !== constants.defaultName && item.name !== name) {
    await store.dispatch('modal/open', {
      type: 'stripName',
      item,
    }); // TODO: can raise an error
  }

  // TODO ajouter contenu du fichier pré-rempli ([uid]: __) + template

  store.commit('fileInfo/setItem', item);

  // Return the new file item
  return store.state.fileInfo.itemsById[id];
}

async function createFolder(name, parentId) {
  const id = utils.uid();
  const item = {
    id,
    name: utils.sanitizeFilename(name),
    parentId: parentId || null,
  };

  // If name is being stripped
  if (item.name !== constants.defaultName && item.name !== name) {
    await store.dispatch('modal/open', {
      type: 'stripName',
      item,
    }); // TODO: can raise an error
  }

  // TODO ajouter contenu du fichier pré-rempli ([uid]: __) + template

  store.commit('folder/setItem', item);

  // Return the new file item
  return store.state.folder.itemsById[id];
}

async function moveFile(id, parentId){
  store.commit('fileInfo/patchItem', {id: id, parentId: parentId});
}

async function moveFolder(id, parentId){
  console.log("Not implemented yet ! (moveFolder)"); // TODO
}

// File Or Folder
async function renameItem(id, name){
  const sanitizedName = utils.sanitizeFilename(name);

  // Show warning dialogs if name has been stripped
  if (sanitizedName !== constants.defaultName && sanitizedName !== item.name) { // TODO est-ce bien utile ce truc de default name ?
    await store.dispatch('modal/open', {
      type: 'stripName',
      item,
    });
  }

  store.commit('fileInfo/patchItem', {id: id, name: sanitizedName});
}

/**
* Delete a file in the store
*/
function deleteFile(fileId) {
  // Delete the file
  store.commit('fileInfo/deleteItem', fileId);
}








// -----------------------------------------------------------------------------
// -- FileInfo & FolderInfo update
// --

/**
* Applique les modifications liées à un Tree patch.
* Attention, ici on ne crée pas de nouveau fichier & on en supprime pas.
* On ne fait que ajouter, mettre à jour et supprimer des FileInfo !
* De même pour les FolderInfo.
*
* Attention, il faudra tout de même vérifier que l'on ne perd pas les données du
* fichier actuellement ouvert.
*
* @param patch: voir rootRepositorySvc.compareTrees
*/
function applyTreePatch(patch){
  // TODO gerer current & autre connerie du genre selected bidule, explorer, save & co


  Object.entries(patch.files.add).forEach(([guid, treeFile]) => {
    const fileInfo = fileInfoSvc.fileInfoFromTreeFile(treeFile);
    store.commit('fileInfo/setItem', fileInfo);
  });
  Object.entries(patch.files.update).forEach(([guid, treeFile]) => {
    const fileInfo = fileInfoSvc.fileInfoFromTreeFile(treeFile);
    store.commit('fileInfo/setItem', fileInfo);
  });
  Object.entries(patch.files.remove).forEach(([guid, treeFile]) => {
    store.commit('fileInfo/deleteItem', treeFile.guid);
  });
  Object.entries(patch.folders.add).forEach(([guid, treeFolder]) => {
    const folderInfo = folderInfoSvc.folderInfoFromTreeFolder(treeFolder);
    store.commit('folder/setItem', folderInfo);
  });
  Object.entries(patch.folders.update).forEach(([guid, treeFolder]) => {
    const folderInfo = folderInfoSvc.folderInfoFromTreeFolder(treeFolder);
    store.commit('folder/setItem', folderInfo);
  });
  Object.entries(patch.folders.remove).forEach(([guid, treeFolder]) => {
    store.commit('folder/deleteItem', treeFolder.guid);
  });
}






// -----------------------------------------------------------------------------
// -- File edition
// --

/**
* Select a file and show its content !
* Workspace is the only one allowed to use fileInfo/setCurrentId. // TODO limite le seul a pouvoir utiliser fileInfo ? ptet pas sinon c'est relou
* It must save changes before switching to the new file !
*/
async function selectFile(fileId){
  store.commit('fileInfo/setCurrentId', fileId);

  let sanitizeText;
  // TODO devrait etre dans workspace !
  // Si le fileGUID correspond à un fichier temporaire, on le récupère depuis la base locale.
  if(fileId.match(TEMP_FILES_GUID_REGEX)){
    // TODO recup de qqpart ?
    sanitizeText = "# Home page"; // TODO to activate !
  } else {
    const currentUID = store.getters['rootRepositories/currentUID']; // TODO, le file n'est pas forcement de ce curent root repo ?!
    let text = await rootRepositorySvc.downloadFile(currentUID, fileId);
    /*try {
      if(fileId === 'spartacus'){
        result = await networkSvc.request('spartacus');
      } else {
        result = await networkSvc.request('test');
      }
    } catch (e) {
      console.error(e);
      result.body = "# 404 - File not found."
    }*/
    sanitizeText = utils.sanitizeText(text);
  }

  store.commit('fileContent/update', {
    text: sanitizeText,
    discussions: {},
  });

  // TODO later : change
  /*
    store.commit('explorer/setSelectedId', currentFileId);
    store.dispatch('explorer/openNode', currentFileId);
    */
}



// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  createFile,
  createFolder,
  moveFile,
  moveFolder,
  renameItem,
  deleteFile,
  applyTreePatch,
  selectFile
};

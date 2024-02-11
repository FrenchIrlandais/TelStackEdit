import store from '../store';
import networkSvc from './networkSvc';
import authenticationSvc from './authenticationSvc';

/**
* Service permettant de faire le lien avec le repository qui contient les documents.
* S'assure de leur upload lorsqu'on veut les consulter, mais aussi de la sauvegarde des modifications.
*/
// -----------------------------------------------------------------------------
// -- Constants
// --
const FILE_SERVER_ERROR = "# 500 - Server error\nOups... something went wrong." // TODO autre part
const FILE_NOT_FOUND = "# 404 - File not found\nThis file does not exist."
const UNAUTHORIZED_FILE = "# 401 - Unauthorized file\nYou need a special access to read this file."

// -----------------------------------------------------------------------------
// -- Root Repositories List
// --
/**
* Retrieve the list of repositories from the server
*/
async function downloadList(){
  try {
    const data = await networkSvc.get('repositories');
    return JSON.parse(data.body);
  } catch (e) {
    console.log("[Error]: Unable to retrieve the repositories list: " + e); // TODO dans une autre console
    return; // TODO gerer l'erreur du repo deleted !
  }
}

// -----------------------------------------------------------------------------
// -- Files
// --
/**
* Retrieve the content of a file with a specific GUID from repositories
*/
async function downloadFile(rootRepoUID, fileGUID){
  // Retrieve token
  const repo = store.getters['rootRepositories/map'][rootRepoUID];
  const token = (repo !== undefined) ? repo.token : undefined;

  try {
    const response = await networkSvc.getWithAuth(`files/${fileGUID}`, token);
    return response.body;
  } catch (e) {
    if(e.status === 401){ // Authorization error - block the window with authentication request
      let success = await authenticationSvc.askAuthentication(rootRepoUID); // update token
      if(!success) {
        return UNAUTHORIZED_FILE; // Pop-up already open or closed window do not retry
      }
      return await downloadFile(rootRepoUID, fileGUID); // retry
    } else if (e.status === 404){
      return FILE_NOT_FOUND;
    }

    console.log("[Error]: Unable to download file: " + e); // TODO dans une autre console
    return FILE_SERVER_ERROR; // TODO gerer l'erreur du file deleted !?
  }
};

// -----------------------------------------------------------------------------
// -- Tree
// --
/**
* Download the tree of one root repository
* A root repository tree is the recursive folders & files information from the root folder.
*/
async function downloadTree(rootRepoUID){
  // Retrieve token
  const repo = store.getters['rootRepositories/map'][rootRepoUID];
  const token = (repo !== undefined) ? repo.token : undefined;

  try {
    const data = await networkSvc.getWithAuth(`repositories/${rootRepoUID}`, token);
    return JSON.parse(data.body); // tree
  } catch (e) {
    if(e.status === 401){ // Authorization error - block the window with authentication request
      let success = await authenticationSvc.askAuthentication(rootRepoUID); // update token
      if(!success) {
        return {error: true, status: 401}; // Pop-up already open or closed window do not retry
      }
      return await downloadTree(rootRepoUID); // retry
    } else if (e.status === 404){
      return {error: true, status: 404};
    }

    console.log("[Error]: Unable to retrieve repository information: " + e); // TODO dans une autre console
    return {error: true, status: 500};
  }
}

// --
// -- Extract Tree Patch
// --
/**
* Compare two TreeFolders and fill the diff object
*
* The tricky part here is that a TreeFile could have moved from one TreeFolder to another.
* Hash will change but not GUID. Therefore the FileInfo must not be removed and added,
* but only updated. Especially because if the deletion happens after the creation, we
* will lose it.
*
* However, if folders move, it (by definition) changes their GUID. Therefore it
* is a creation and a deletion. TreeFolders don't "move".
*
* @param fv1: TreeFolder version 1
* @param fv2: TreeFolder version 2
* @param diff.files.prev: map of every TreeFiles that could have been deleted, updated or moved from previous version
* @param diff.files.curr: map of every TreeFiles that could have been added, updated or moved since current version
* @param diff.folders.add: map of every new TreeFolders
* @param diff.folders.update: map of every updated TreeFolders
* @param diff.folders.remove: map of every removed TreeFolders
*/
function compareTreeFoldersRec(fv1, fv2, diff){
  if(fv1.hash === fv2.hash){
    return;
  }

  // Files
  const filesHashMap = {};
  for(var i=0; i<fv1.files.length; i++){
    filesHashMap[fv1.files[i].guid] = fv1.files[i].hash;
  }
  for(var i=0; i<fv2.files.length; i++){
    if(filesHashMap[fv2.files[i].guid] !== fv2.files[i].hash){
      diff.files.curr[fv2.files[i].guid] = fv2.files[i]; // New diff
    } else {
      // On ne supprime cette ref que si c'est le même hash, car on veut aussi ajouter le fichier aux diff previous (si il y'a un fichier à ce guid bien sûr)
      filesHashMap[fv2.files[i].guid] = undefined;
    }
  }
  for(var i=0; i<fv1.files.length; i++){
    if(filesHashMap[fv1.files[i].guid] !== undefined){
      diff.files.prev[fv1.files[i].guid] = fv1.files[i]; // New diff
    }
  }

  // Folders
  const foldershMap = {};
  const foldersHashMap = {};
  for(var i=0; i<fv1.folders.length; i++){
    foldersHashMap[fv1.folders[i].guid] = fv1.folders[i].hash;
    foldershMap[fv1.folders[i].guid] = fv1.folders[i];
  }
  for(var i=0; i<fv2.folders.length; i++){
    if(foldersHashMap[fv2.folders[i].guid] !== fv2.folders[i].hash){
      if(foldersHashMap[fv2.folders[i].guid] === undefined){
        // New folder
        diff.folders.add[fv2.folders[i].guid] = fv2.folders[i];
        // Do a recursive call on an empty folder in order to add new files & folders
        compareTreeFoldersRec({files:[], folders:[]}, fv2.folders[i], diff);
      } else {
        // Update folder
        diff.folders.update[fv2.folders[i].guid] = fv2.folders[i];
        compareTreeFoldersRec(foldershMap[fv2.folders[i].guid], fv2.folders[i], diff);
      }
    }
    // Ici par contre, on supprime la ref dans les deux cas car on a aussi traité le cas previous
    foldersHashMap[fv2.folders[i].guid] = undefined;
  }
  for(var i=0; i<fv1.folders.length; i++){
    if(foldersHashMap[fv1.folders[i].guid] !== undefined){
      diff.folders.remove[fv1.folders[i].guid] = fv1.folders[i];
      // Do a recursive call on an empty folder in order to add files diff and remove sub-folders
      compareTreeFoldersRec(fv1.folders[i], {files:[], folders:[]}, diff);
    }
  }
}

/**
* Inpecte les différences de hash entre deux versions de root repository Tree
* afin d'en extraire un patch des modifications à faire sur le store.
*
* @param previous: previous Tree version
* @param current: last downloaded Tree version
* @return patch: {
*    files: {
*      add: {},        // map(GUID,TreeFile) des FileInfo à ajouter
*      update: {},     // map(GUID,TreeFile) des FileInfo à mettre à jour
*      remove: {}      // map(GUID,TreeFile) des FileInfo à supprimer
*    },
*    folders: {
*      add: {},        // map(GUID,TreeFolder) des FolderInfo à ajouter
*      update: {},     // map(GUID,TreeFolder) des FolderInfo à mettre à jour
*      remove: {}      // map(GUID,TreeFolder) des FolderInfo à supprimer
*    }
*  }
*/
function compareTrees(previous, current){
  // Check if same hash before doing anything
  if(current.hash === previous.hash){
    return;
  }

  let diff = {
    files: {
      prev: {},
      curr: {}
    },
    folders: {
      add: {},
      update: {},
      remove: {}
    }
  };

  // Build diff object
  compareTreeFoldersRec(previous, current, diff);

  let foldersPatch = diff.folders; // Easy one
  let filesPatch = {
    add: {},
    update: {},
    remove: {}
  };

  // Build files patch - detect files move/update
  Object.entries(diff.files.curr).forEach(([guid, file]) => {
    if(diff.files.prev[guid] === undefined) {
      // New file
      filesPatch.add[guid] = file;
    } else if(diff.files.prev[guid].hash !== file.hash){
      // Updated or moved file
      filesPatch.update[guid] = file;
    } else {
      console.log("Should not happen."); // TODO delete alors ?
    }
  });
  Object.entries(diff.files.prev).forEach(([guid, file]) => {
    if(diff.files.curr[guid] === undefined) {
      // New file
      filesPatch.remove[guid] = file;
    }
    // Updated have already been treated
  });

  console.log("New patch :");
  console.log(filesPatch);
  console.log(foldersPatch);

  return {
    files: filesPatch,
    folders: foldersPatch
  };
}

// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  downloadList,
  downloadFile,
  downloadTree,
  compareTrees,
};

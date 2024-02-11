const fs = require('fs');
const path = require('path');
const semaphoreConstructor = require('./semaphore');
const authenticationToken = require('./authenticationToken');
const cryptoSvc = require('../../src/common/cryptoSvc');

// -----------------------------------------------------------------------------
// -- UIDs
// --
/**
* Pour les UID (unique ID) des fichiers & dossiers, il faut distinguer deux choses :
* - l'UID local, qui est unique, mais seulement pour les éléments d'un même RootRepository.
* - le GUID (global UID), qui est unique, même entre plusieurs RootRepository.
* Pour ce faire, le GUID correspond à l'aggregation unique :
* - <repoUID>-<localUID> pour les fichiers. (unique car `-` n'est pas utilisé dans la consititution des UID locaux)
* - <repoUID>/<localUID> pour les dossiers. (unique car `/` (ou `\`) ne sont pas utilisés dans l'UID d'un RootRepo)
*
* Règles des UID (local) :
* - Chaque RootRepository possède un UID, construit à partir des caractères suivants : [A-Za-z0-9] (lettres & chiffres).
* - Chaque folder possède un UID, il s'agit de son `relativePath`.
* Celui-ci est composé des caractères autorisé pour les noms de dossiers, plus le caractère `/`.
* - Chaque fichier possède un UID, directement inscrit dans le fichier à l'aide de la balise `[uid]: `
*
* Exemple :
* - Mon RootRepository a comme UID : act750
* - Mon folder a comme UID : /build/doc, et comme GUID : default/build/doc
* - Mon file a comme UID : Hg6ulPj0, et comme GUID : default-Hg6ulPj0
*
*/
//
// File UID map
//
const FILE_UID_MAP = {};
function generateFileUID(){
  let result = undefined;
  while(result === undefined || FILE_UID_MAP[result] === true){
    result = cryptoSvc.randomFileUID();
  }
  FILE_UID_MAP[result] = true;

  return result;
}

//
// RootRepository local UID map
//
function localUIDMapConstructor(){
  return {
    map: {},
    reset(){
      this.map = {};
    },
    add(uid, item){
      if(this.map[uid] !== undefined){
        console.log('Error: uid: '+uid+' already exist for this RootRepository. Could not save the item '+item.name+'.');
        throw 'duplicate uid'; // TODO change, see backlog
      }
      this.map[uid] = item;
    },
    get(uid){
      return this.map[uid];
    }
  }
}

// RootRepo UID
const ROOT_UID_VALID = /^[A-Za-z0-9]*$/g;
const ROOT_UID_MAP = {};
function checkValidRootUID(uid){
  if(uid.match(ROOT_UID_VALID) === null){
    return false; // not a valid uid
  }

  if(ROOT_UID_MAP[uid]){
    return false; // already exists
  }
  ROOT_UID_MAP[uid] = true;
  return true;
}

// Folder GUID
function computeFolderUID(folderInfo){
  return folderInfo.relativePath;
}

function computeFolderGUID(folderInfo, uid){
  return folderInfo.rootRepoUid + '/' + uid;
}

function setFolderGUID(folderInfo, localUIDMap){
  let uid = computeFolderUID(folderInfo);
  localUIDMap.add(uid, folderInfo); // check
  let guid = computeFolderGUID(folderInfo, uid);

  // Set
  folderInfo.uid = uid;
  folderInfo.guid = guid;
}

// File GUID
const FILE_UID_VALID_CHARS = /[A-Za-z0-9]/g;
function extractUIDFromFileName(name){
  return name.match(FILE_UID_VALID_CHARS).join('');
}

function computeFileGUID(fileInfo, uid){
  return fileInfo.rootRepoUid + '-' + uid
}

function setFileGUID(fileInfo, uid, localUIDMap){
  localUIDMap.add(uid, fileInfo); // check
  let guid = computeFileGUID(fileInfo, uid);

  // Set
  fileInfo.uid = uid;
  fileInfo.guid = guid;
}

// -----------------------------------------------------------------------------
// --- Tree: retrieve repository files & folders
// ---

//
// File info extraction
//
const TITLE_LINE_REGEX = /^# (.*)$/g;
const UID_LINE_REGEX = /^\[uid\]:\s*([A-Za-z0-9]*)$/g;

// Extract uid & title of the document.
function extractFileInfo(data, fileInfo, rootRepo){
  let uidFound = false;
  let titleFound = false;
  const lines = data.split('\n');

  let i = 0;
  while(!uidFound || !titleFound) {
    if(i >= lines.length){
      if(!uidFound) {
        console.log("[Warning]: " + fileInfo.relativePath + " does not contain any UID. Tracking is disabled.");
        let uid = extractUIDFromFileName(fileInfo.name);
        setFileGUID(fileInfo, uid, rootRepo.filesUIDMap);
      }
      if(!titleFound) {
        fileInfo.title = "";
      }
      return;
    }

    if(!uidFound) {
      if(lines[i].match(UID_LINE_REGEX) !== null) {
        let uid = RegExp.$1;
        setFileGUID(fileInfo, uid, rootRepo.filesUIDMap);
        uidFound = true;
      }
    }
    if(!titleFound) {
      if(lines[i].match(TITLE_LINE_REGEX) !== null) {
        fileInfo.title = RegExp.$1;
        titleFound = true;
      }
    }

    i++;
  }

  return;
}

//
// Constructors
//
function folderInfoConstructor(rootRepo, parentRelativePath, name, parent){
  const result = {
    "uid": 0,   // filled below
    "guid": 0,  // filled below
    "name": name,
    "parentRelativePath" : parentRelativePath,
    "relativePath": path.join(parentRelativePath, name),
    "rootRepoUid": rootRepo.uid,
    "files": [],
    "folders": [],
    "parent": parent, // use for cleaning, removed at the end
    "parentGuid": (parent? parent.guid : null),
    "hash": undefined // determine if the folder or one of its children !!! has changed
  };

  // Set UID & GUID
  setFolderGUID(result, rootRepo.filesUIDMap);
  return result;
}

function fileInfoConstructor(rootRepo, parentRelativePath, name, parent, allowedExtensions, semaphore) {
  var split = name.split('.');
  var ext = split.pop();
  var shortName = split.join('.');

  // Only keep allowed files
  if(!allowedExtensions.includes(ext)){
    return undefined;
  }

  const fileInfo = {
    "uid": 0,   // filled after
    "guid": 0,  // filled after
    "name": name,
    "relativePath": path.join(parentRelativePath, name),
    "parentRelativePath" : parentRelativePath,
    "rootRepoUid": rootRepo.uid,
    "shortName": shortName,
    "extension" : ext,
    "parentGuid": (parent? parent.guid : null),
    "title": undefined,
    "hash": undefined // be careful, it does not matter if the file content change here. It's only about metadata.
  };
  // title will be extracted asynchronously, it will be filled later.
  // hash will need to be filled after

  semaphore.take(); // prend une ressource
  fs.readFile(path.join(rootRepo.rootPath, parentRelativePath, name), 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      // let the title undefined but don't forget to release the semaphore !
      semaphore.release(); // relache la ressource
      return;
    }

    extractFileInfo(data, fileInfo, rootRepo);
    semaphore.release(); // relache la ressource
  });

  return fileInfo;
}

//
// Exploration
//

function removeEmptyFolderRecursive(folderInfo){
  if(folderInfo.parent){ // don't remove root
    // Remove folder without any files or folders
    if(folderInfo.folders.length === 0 && folderInfo.files.length === 0){
      const index = folderInfo.parent.folders.indexOf(folderInfo);
      if (index > -1) {
        folderInfo.parent.folders.splice(index, 1);
        removeEmptyFolderRecursive(folderInfo.parent);
      }
    }
  }
}

function exploreDirectoryRecursive(rootRepo, parentRelativePath, directoryName, parent, ignoredDirectoryList, allowedExtensions, semaphore) {
  semaphore.take(); // prend une ressource
  let result = folderInfoConstructor(rootRepo, parentRelativePath, directoryName, parent);

  var dir = path.join(rootRepo.rootPath, parentRelativePath, directoryName);
  // Cherche tout les fichiers ou dossiers dans ce *directory*
  fs.readdir(dir, (err, files) => {
    if(err || files.length === 0) {
      if(err) { console.log(err); }
      removeEmptyFolderRecursive(result); // also delete the folder
      semaphore.release(); // relache la ressource
      return;
    }

    // After treating all sub-files, decide if we remove this folder
    // reminder that here there is at-leas on sub-file or sub-folder, therefore n will be > 0
    const subfilesProcessingSemaphore = semaphoreConstructor(() => {
      // End of folder creation:
      removeEmptyFolderRecursive(result);
    });
    subfilesProcessingSemaphore.n = files.length;

    // Pour chaqu'un, determine si il s'agit d'un fichier ou d'un dossier
    files.forEach((file) => {
      semaphore.take(); // prend une ressource
      fs.stat(path.join(dir, file), (err, data) => {
        if(err) {
          console.log(err);
          semaphore.release(); // relache la ressource
        }

        if (data.isDirectory()) {
          if(!ignoredDirectoryList.includes(file)){ // discard .git and other ignored forlders
            const folderInfo = exploreDirectoryRecursive(rootRepo, path.join(parentRelativePath, directoryName), file, result, ignoredDirectoryList, allowedExtensions, semaphore);
            if(folderInfo !== undefined){
              result.folders.push(folderInfo);
            }
          }
        }
        else {
          var fileInfo = fileInfoConstructor(rootRepo, path.join(parentRelativePath, directoryName), file, result, allowedExtensions, semaphore);
          if(fileInfo !== undefined){ // Filter not allowed files
            result.files.push(fileInfo);
          }
        }

        subfilesProcessingSemaphore.release();
        semaphore.release(); // relache la ressource
      });
    });

    semaphore.release(); // relache la ressource
  });

  return result;
}

//
// hash computation
//
function setFileHash(fileInfo) {
  const stringToHash = fileInfo.guid + '.' + fileInfo.relativePath + '.' + fileInfo.title;
  // The following info are not included in the hash:
  // - rootRepoUid is redundant with GUID
  // - UID is redundant with GUID
  // - name is redundant with relativePath
  // - parentRelativePath is redundant with relativePath
  // - shortName is redundant with relativePath
  // - extension is redundant with relativePath

  fileInfo.hash = cryptoSvc.hashString(stringToHash);
  return fileInfo.hash;
}

function setFolderHashRec(folderInfo) {
  let stringToHash = folderInfo.guid;
  // The following info are not included in the hash:
  // - UID is redundant with GUID
  // - UID is redundant because it is extracted from relativePath.
  // - name is redundant with relativePath
  // - parentRelativePath is redundant with relativePath
  // - parent is redundant with relativePath

  let hash = cryptoSvc.hashString(stringToHash);

  // Becareful here, the order of files/folder is not guaranteed
  // Therefore we MUST USE and ASSOCIATIVE operator
  // That is why we use here an XOR bitwise operator
  // Attention, here we assume sub-file & sub-folder hash have already been determined
  for(var i=0; i<folderInfo.files.length; i++){
    hash = hash ^ setFileHash(folderInfo.files[i]);
  }
  for(var i=0; i<folderInfo.folders.length; i++){
    hash = hash ^ setFolderHashRec(folderInfo.folders[i]);
  }

  folderInfo.hash = hash;
  return folderInfo.hash;
}

//
// remove parent circular reference
//
function removeParentCircularRec(folderInfo) {
  folderInfo.parent = undefined;

  for(var i=0; i<folderInfo.folders.length; i++){
    removeParentCircularRec(folderInfo.folders[i]);
  }
}

//
// main function
//

function asyncRetrieveFilesAndFolders(rootRepository, callback) {
  let result;
  const semaphore = semaphoreConstructor(() => {
    //
    // End of exploration
    //
    setFolderHashRec(result); // fill all hash
    removeParentCircularRec(result); // remove parent ref
    result.name = rootRepository.name; // Rename root folder with rootRepository name
    callback(result);
  });

  // Reset local UID maps
  rootRepository.filesUIDMap.reset();
  rootRepository.foldersUIDMap.reset();

  // Start exploration
  result = exploreDirectoryRecursive(rootRepository, "", "", undefined, rootRepository.ignoredFolders, rootRepository.requestedExtensions, semaphore);
}

// -----------------------------------------------------------------------------
// -- Root repository information
// --
function rootRepositoryConstructor(uid, name, path, description, icon, ignoredFolders, requestedExtensions, pwdHash, tokenType){
  if(!checkValidRootUID(uid)){
    throw 'Error: ' + uid + ' is not a valid UID for a RootRepository';
  }

  return {
    uid: uid,
    name: name,
    description: description,
    icon: icon,

    // Local information
    rootPath: path,
    ignoredFolders: ignoredFolders,
    requestedExtensions: requestedExtensions,

    // Authentication information
    passwordHash: pwdHash, /* For obvious security reason, we only store the hash of the password of the repo */
    tokens: authenticationToken.bunchConstructor(tokenType),
    getToken(pwd){ /* Retrieve a token, given the repo password */
      let hash = cryptoSvc.hashString(pwd);
      if(hash === this.passwordHash){
        return this.tokens.generate();
      }
      return undefined; // Invalid password
    },
    authenticate(tokenKey){
      return this.tokens.isValid(tokenKey);
    },

    // Tree information
    filesUIDMap: localUIDMapConstructor(),
    foldersUIDMap: localUIDMapConstructor(),
    tree: undefined,
    asyncUpdate(resolveCallback){ /* Update Tree information & UIDmaps, callback when it is done */
      asyncRetrieveFilesAndFolders(this, (result) => {
        this.tree = result;
        resolveCallback();
      });
    }
  };
}

// -----------------------------------------------------------------------------
// -- Public
// --
module.exports = rootRepositoryConstructor;

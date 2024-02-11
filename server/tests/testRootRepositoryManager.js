const fs = require('fs');
const path = require('path');
const rootRepository = require('../libs/rootRepositoryManager');

// -----------------------------------------------------------------------------
// -- Root repository manager tests
// --
//
// Print
//
function getPrintFile(fileInfo){
  return fileInfo.name + " ("+fileInfo.guid+") hash:"+fileInfo.hash+"\n";
}

function getPrintFolderRec(folderInfo, prefix){
  let result = prefix + folderInfo.name + " ("+folderInfo.guid+") hash:"+folderInfo.hash+"\n";
  const newPrefix = prefix + ' | ';
  for(var i=0; i<folderInfo.files.length; i++){
    result += newPrefix + getPrintFile(folderInfo.files[i]);
  }
  for(var i=0; i<folderInfo.folders.length; i++){
    result += getPrintFolderRec(folderInfo.folders[i], newPrefix);
  }
  return result;
}

function printFolder(folderInfo){
  console.log(getPrintFolderRec(folderInfo, ''));
}

//
// Look for hash difference
//
/* @DEPRECATED */
function compareFoldersHashRecursive(fv1, fv2, prefix = ''){
  if(fv1.hash === fv2.hash){
    return;
  }

  const filesHashMap = {};
  for(var i=0; i<fv1.files.length; i++){
    filesHashMap[fv1.files[i].guid] = fv1.files[i].hash;
  }
  for(var i=0; i<fv2.files.length; i++){
    if(filesHashMap[fv2.files[i].guid] !== fv2.files[i].hash){
      if(filesHashMap[fv2.files[i].guid] === undefined){
        console.log(prefix + fv2.files[i].relativePath + " is a new file.");
      } else {
        console.log(prefix + fv2.files[i].relativePath + " (file) has changed.");
      }
    }

    filesHashMap[fv2.files[i].guid] = undefined;
  }
  for(var i=0; i<fv1.files.length; i++){
    if(filesHashMap[fv1.files[i].guid] !== undefined){
      console.log(prefix + fv2.files[i].relativePath + " (file) has been deleted.");
    }
  }

  const foldershMap = {};
  const foldersHashMap = {};
  for(var i=0; i<fv1.folders.length; i++){
    foldersHashMap[fv1.folders[i].guid] = fv1.folders[i].hash;
    foldershMap[fv1.folders[i].guid] = fv1.folders[i];
  }
  for(var i=0; i<fv2.folders.length; i++){
    if(foldersHashMap[fv2.folders[i].guid] !== fv2.folders[i].hash){
      if(foldersHashMap[fv2.folders[i].guid] === undefined){
        console.log(prefix + fv2.folders[i].relativePath + " is a new folder.");
      } else {
        console.log(prefix + fv2.folders[i].relativePath + " (folder) has changed:");
        compareFoldersHashRecursive(foldershMap[fv2.folders[i].guid], fv2.folders[i], prefix+'> ');
      }

    }

    foldersHashMap[fv2.folders[i].guid] = undefined;
  }
  for(var i=0; i<fv1.folders.length; i++){
    if(foldersHashMap[fv1.folders[i].guid] !== undefined){
      console.log(prefix + fv2.folders[i].relativePath + " (folder) has been deleted.");
    }
  }
}

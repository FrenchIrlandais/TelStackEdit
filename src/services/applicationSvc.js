import localDbSvc from './localDbSvc';
import rootRepositorySvc from './rootRepositorySvc';
import workspaceSvc from './workspaceSvc';
import store from '../store';

// -----------------------------------------------------------------------------
// -- Constants
// --
const REPO_LIST_RESYNC_PERIODICITY = 5 * 1000; // TODO plus tard: 30 * 1000;
const REPO_RESYNC_PERIODICITY = 10 * 1000; // TODO plus tard: 5 * 1000;
const LOCAL_DB_SAVE_PERIODICITY = 1 * 1000;

// -----------------------------------------------------------------------------
// -- Root repositories list
// --
/**
* Retrieve the list of repositories from the server
*/
async function resyncRepositoriesList(){
  let map = await rootRepositorySvc.downloadList();
  if(map === undefined){
    return; // TODO: raise error ?
  }

  store.commit('rootRepositories/patchMap', map);

  // Check if current still exist
  const currentUID = store.getters['rootRepositories/currentUID'];
  if (currentUID !== undefined){
    if (map[currentUID] === undefined){
      switchRootRepository(undefined); // Switch to Home Page
    }
  }

  // TODO
  // Il devrait y'avoir un store / home page ou on voit tout les repo dispo
  // il faudra l'update, (ou si c'est un store, que ça soit reactive)
}

// -----------------------------------------------------------------------------
// -- Current repository
// --
let CURRENT_ROOT_REPOSITORY_TREE = {
  files:[],
  folders:[],
  hash: undefined
}; //  TODO, move maybe dans explorer ?

/**
* Recupère les possibles modifications de fichiers/dossiers sur le
* root repository que l'on regarde actuellement.
*/
let RESYNC_TREE_MUTEX = false; // Prevent parallele resync
async function resyncRootRepository(){
  if(RESYNC_TREE_MUTEX){ // cancel
    return;
  }

  RESYNC_TREE_MUTEX = true; // take mutex
  await resyncRootRepositoryMono();
  RESYNC_TREE_MUTEX = false; // release mutex
}
async function resyncRootRepositoryMono(){
  let tree;
  const currentUID = store.getters['rootRepositories/currentUID'];
  if(currentUID === undefined){ // Home Page redirection
    tree = {
      files:[],
      folders:[],
      hash: undefined
    };
  } else {  // Real Root Repository
    tree = await rootRepositorySvc.downloadTree(currentUID);
    if(tree.error){
      if(tree.status === 401 || tree.status === 404) { // Unauthorized or unknown
        console.log("Return to Home Page");
        // return to Home page
        store.commit('rootRepositories/setCurrentUID', undefined);
        await resyncRootRepositoryMono(); // We can call it directly because we still own the mutex (but we need to await)
        return;
      } else if (tree.status === 500) { // Lost connection with repo TODO: set offline (read only)
        console.log("Offline mode");
        return;
      } else {
        console.log("Unknown error");
        return;
      }
    }
  }

  let previous = CURRENT_ROOT_REPOSITORY_TREE;

  // Extract patch of differences
  let patch = rootRepositorySvc.compareTrees(previous, tree);
  if(patch === undefined){
    return; // Nothing to patch here
  }

  // Apply it
  workspaceSvc.applyTreePatch(patch);

  // Save it
  CURRENT_ROOT_REPOSITORY_TREE = tree;
}

/**
* Switch root repository
*/
function switchRootRepository(rootRepoUid){
  store.commit('rootRepositories/setCurrentUID', rootRepoUid);
  resyncRootRepository();
}

// -----------------------------------------------------------------------------
// -- Init
// --
async function init(readyCallback){
  // --
  // -- Loading (splash screen) - Synchronous operations
  // --
  // Load the DB synchronously to be in a coherent state before removing splash screen
  await localDbSvc.init(LOCAL_DB_SAVE_PERIODICITY);

  // Loading screen end here, what is following is asynchronous
  readyCallback();

  // --
  // -- Application Ready - Asynchronous operations
  // --
  // First synchronization
  resyncRepositoriesList();

  // TODO: resyncRootRepository --> ou bien génération manuelle de la home page ?

  // Resync regularly
  setInterval(() => resyncRepositoriesList(), REPO_LIST_RESYNC_PERIODICITY);
  setInterval(() => resyncRootRepository(), REPO_RESYNC_PERIODICITY);
}

// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  init,
  switchRootRepository // TODO utilisé par qui ?
}

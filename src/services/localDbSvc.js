import store from '../store';

/**
* LocalStorage sert à stocker les données suivantes :
* - user settings
* - last layout state
* - trash files
* - tokens
*
* Le but de cette base de données est d'être chargée au demarrage, permettant ainsi de restorer les settings de la session précédente.
* Puis d'être regulièrement sauvegardée avec l'état courant du système pour la prochaine session.
*/
// -----------------------------------------------------------------------------
// -- Database
// --
/**
* Map of hash of every item in the localStorage in order to only save items when they have been modified
*/
const hashMap = {
  userSettings: null,
  layoutState: null,
  trashFilesInfo: {},  // TODO
  trashFilesContent: {},  // TODO
}

// TODO save & load tokens !

/**
* Load the localStorage in memory !
*/
async function load(){
  // Load user settings
  try {
    const storedUserSettings = JSON.parse(localStorage.getItem('data/userSettings'));
    hashMap.userSettings = storedUserSettings.hash;
    store.commit('data/loadUserSettings', storedUserSettings); // TODO user a better setter ?
  } catch (e) {
    console.log("Could not load user settings from previous session.");
  }

  // Load layout state
  try {
    const storedLayoutState = JSON.parse(localStorage.getItem('data/layoutState'));
    hashMap.layoutState = storedLayoutState.hash;
    store.commit('data/patchLayoutState', storedLayoutState); // TODO user a better setter ?
  } catch (e) {
    console.log("Could not load layout state from previous session.");
  }

  // Cached root repositories (for authentication tokens)
  try {
    const storedRootRepositories = JSON.parse(localStorage.getItem('local/rootRepositories'));
    if(storedRootRepositories != null) {
      store.commit('rootRepositories/setMap', storedRootRepositories);
    }
  } catch (e) {
    // is ok
  }

  // Load trash files
  // TODO implements
}

/**
* Save current data state in localStorage
*/
async function save(){
  // Save user settings if it has been modified
  const userSettings = store.state.data.userSettings; // TODO utiliser un getter classoique ?
  if(userSettings.hash !== hashMap.userSettings){
    localStorage.setItem('data/userSettings', JSON.stringify(userSettings));
    hashMap.userSettings = userSettings.hash;
  }

  // Save layout state if it has been modified
  const layoutState = store.state.data.layoutState; // TODO utiliser un getter classoique ?
  if(layoutState.hash !== hashMap.layoutState){
    localStorage.setItem('data/layoutState', JSON.stringify(layoutState));
    hashMap.layoutState = layoutState.hash;
  }

  // Save root repositories if it has been modified
  const updateNeeded = store.getters['rootRepositories/mapChanged'];
  if(updateNeeded){
    store.commit('rootRepositories/resetMapChanged');
    const map = store.getters['rootRepositories/map'];
    localStorage.setItem('local/rootRepositories', JSON.stringify(map));
  }

  // TODO: save trash files
}

// -----------------------------------------------------------------------------
// -- Init
// --
/**
* Load the DB and start saving regularly
*/
async function init(savePeriodicity) {
  // Load the DB synchronously (AWAIT) before saving anything !
  await load();

  // Save in local DB periodically
  setInterval(() => save(), savePeriodicity);
}

// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  init
};

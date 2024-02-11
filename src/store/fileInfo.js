import storeFactory from './storeFactory';
import fileInfoSvc from '../services/fileInfoSvc';

const mod = storeFactory(fileInfoSvc.emptyFileInfoConstructor);

/**
* Storage for files but with a 'current' that target the current opened file
*/

// --
// -- State
// --
mod.state.currentId = null;

// --
// -- Mutations
// --
mod.mutations.setCurrentId = function(state, value){
  return state.currentId = value;
};

// --
// -- Getters
// --
mod.getters.current = function({ itemsById, currentId }){
  return itemsById[currentId] || fileInfoSvc.emptyFileInfoConstructor(null);
}
// TODO pas sur de l'interet, pas sur que ça devrait etre là...
mod.getters.lastOpened = function({ itemsById }, { items }, rootState, rootGetters){
  return itemsById[rootGetters['data/lastOpenedIds'][0]] || items[0] || fileInfoSvc.emptyFileInfoConstructor(null);
}

// --
// -- Actions
// --
mod.actions.patchCurrent = ({ getters, commit }, value) => {
  value.id = getters.current.id;
  commit('patchItem', value);
};

export default mod;

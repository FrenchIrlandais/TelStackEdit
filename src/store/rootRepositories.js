import Vue from 'vue';

function storedRootRepositoryConstructor(repoInfo){
  return {
    name: repoInfo.name,
    icon: repoInfo.icon,
    description: repoInfo.description,
    token: undefined
  }
}

export default {
  namespaced: true,
  state: {
    /*
    * Map of every active root repositories. key: rootRepoUID, value: storedRootRepository
    * Rappel: il faut utiliser :
    * - Vue.set(state.map, uid, item);
    * - Vue.delete(state.map, uid);
    *
    * Sans quoi la map ne sera pas reactive !! Il n'y a pas d'observeur sur le contenu de l'objet,
    * et si sa reference ne change pas, rien ne sera trigger...
    */
    map: {},
    mapChanged: false, // for localDB save
    /**
    * L'editeur permet de consulter les root repositories un par un.
    * Si aucun n'est selectionné alors on se retrouve sur la Home Page.
    */
    currentUID: undefined, // UID of targeted root repository, default: Home Page
  },
  mutations: {
    setMap: (state, value) => { // for load from localDB
      state.map = value;
    },
    patchMap: (state, value) => {
      const map = state.map;
      // Clear removed repos
      Object.keys(map).forEach((uid) => {
        if(value[uid] === undefined){
          Vue.delete(state.map, uid);
          state.mapChanged = true;
        }
      });

      // Update map, do not override tokens !
      Object.entries(value).forEach(([uid, repo]) => {
        if(map[uid] === undefined){
          Vue.set(state.map, uid, storedRootRepositoryConstructor(repo)); // add new
          state.mapChanged = true;
        } else {
          // Check changes
          let updated = false;
          Object.entries(repo).forEach(([k, v]) => {
            if(v !== map[uid][k]){
              map[uid][k] = v;
              updated = true;
            }
          });
          if(updated) {
            Vue.set(state.map, uid, map[uid]); // update (for reactivity)
            state.mapChanged = true;
          }
        }
      });
    },
    updateToken: (state, {uid, token}) => {
      if(state.map[uid] !== undefined){ // Otherwise we do nothing
        state.map[uid].token = token;
        Vue.set(state.map, uid, state.map[uid]); // For reactivity
        state.mapChanged = true;
      }
    },
    setCurrentUID: (state, uid) => {
      state.currentUID = uid;
    },
    resetMapChanged: (state) => {
      state.mapChanged = false;
    }
  },
  getters: {
    map: ({ map }) => map,
    currentUID: ({ currentUID }) => currentUID,
    mapChanged: ({ mapChanged }) => mapChanged,
    //current: ({ map, currentUID }) => map[currentUID], TODO remove
  },
};

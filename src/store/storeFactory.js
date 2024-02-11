import Vue from 'vue';
import utils from '../services/utils';

/**
* TODO: refactoring hash function
* TODO: setItem: changer la signature pour setItem(state, id, value)
*/

export default function constructor(itemConstructor, simpleHash = false) {
  // Use Date.now() as a simple hash function, which is ok for not-synced types
  const hashFunc = simpleHash ? Date.now : item => utils.getItemHash(item);

  return {
    namespaced: true,
    state: {
      /**
      * Store data structure
      * Dictionnary with all stored items, indexed by ID
      * Close to a hashmap
      *
      * Vue n’autorise pas l’ajout dynamique de nouvelles propriétés réactives au
      * niveau de la racine dans une instance déjà créée. Toutefois, il est possible
      * d’ajouter des propriétés réactives à un objet imbriqué à l’aide de la méthode
      * Vue.set(object, propertyName, value)
      *
      * Par conséquent, les ajouts dans la map se feront à l'aide de Vue.set
      */
      itemsById: {},
    },
    getters: {
      /**
      * Retrieve ALL items stored
      */
      items: ({ itemsById }) => Object.values(itemsById),
    },
    mutations: {
      /**
      * Create a new item and add all attributs of {value} to it.
      */
      setItem(state, value) {
        const item = Object.assign(itemConstructor(value.id), value); // TODo refactore ....
        if (!item.hash || !simpleHash) {
          item.hash = hashFunc(item);
        }
        Vue.set(state.itemsById, item.id, item);
      },

      /**
      * Retrieve an already stored item and add all attributs of {value} to it. // TODO delete cette merde, en fait nan ptet pas
      */
      patchItem(state, patch) {
        const item = state.itemsById[patch.id];
        if (item) {
          Object.assign(item, patch);
          item.hash = hashFunc(item);
          Vue.set(state.itemsById, item.id, item);
          return true;
        }
        return false;
      },

      /**
      * Remove an already stored item.
      */
      deleteItem(state, id) {
        Vue.delete(state.itemsById, id);
      },
    },
    actions: {},
  };
};

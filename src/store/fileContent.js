import utils from '../services/utils';

/**
* Ce store contient le contenu du fichier que l'on est en train de visualiser.
* Ce contenu est chargé à la volée par une requête HTTP sur le document.
*/

export default {
  namespaced: true,
  state: {
    text: '\n',
    properties: '\n',
    discussions: {}, // Apparently discussions are chunks of the text in order to undo/redo
    hash: 0,
  },
  getters: {
    getText: ({ text }) => text,
    getProperties: ({ properties }) => properties,
    getDiscussions: ({ discussions }) => discussions,
    getHash: ({ hash }) => hash,

    // Permet de detecter un changement dans l'id, le text ou le hash. TODO a quoi ça sert exactement ?
    changeTrigger: function(state) {
      return utils.serializeObject([
        state.text,
        state.hash,
      ]);
    },

    // In order to know if we are in edit mode. // TODO c'est une redirection de loyout/styles ... est-ce bien necessaire du coup ?
    isEditable: function(state, getters, rootState, rootGetters){
      return rootGetters['layout/styles'].showEditor;
    },
  },
  mutations: {
    update(state, value) {
      if(value.text){ state.text = value.text; }
      //if(value.properties){ state.properties = value.properties; }  TODO, for the moment, dont do that
      if(value.discussions){ state.discussions = value.discussions; }
      if(value.hash){ state.hash = value.hash; }
    },
    // TODO: do specific for each attributs ?!
    setProperties(state, props) {
      state.properties = props;
    },
  },
  actions: {
  },
};

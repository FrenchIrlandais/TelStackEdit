import createLogger from 'vuex/dist/logger';
import Vue from 'vue';
import Vuex from 'vuex';
import utils from '../services/utils';
import rootRepositories from './rootRepositories';
import folder from './folder';
import fileInfo from './fileInfo';
import fileContent from './fileContent';
import contextMenu from './contextMenu';
import data from './data';
import explorer from './explorer';
import findReplace from './findReplace';
import layout from './layout';
import modal from './modal';
import constants from '../data/constants';

Vue.use(Vuex);

const debug = NODE_ENV !== 'production';

const store = new Vuex.Store({
  modules: {
    rootRepositories,
    folder,
    fileInfo,
    fileContent,
    contextMenu,
    data,
    explorer,
    findReplace,
    layout,
    modal,
  },
  state: {
    light: false, // Option when opening a "stackedit" pop-up in a window (with stackedit.js for instance)
    timeCounter: 0, // TODO: explain timeCounter
  },
  mutations: {
    setLight: (state, value) => {
      state.light = value;
    },
    updateTimeCounter: (state) => {
      state.timeCounter += 1;
    },
  },
  getters: {
    allItemsById: (state) => {
      const result = {};
      // Aggregates itemsById map from fileInfo, folder store // TODO mais c'est degeulasse ? qui utilise allItemsById ? ils sont cons ou wtf
      Object.assign(result, state.fileInfo.itemsById);
      Object.assign(result, state.folder.itemsById);
      return result;
    },
  },
  actions: {},
  strict: debug,
  plugins: debug ? [createLogger()] : [], // TODO delete plus tard ? ou bien tester
});

setInterval(() => {
  store.commit('updateTimeCounter');
}, 30 * 1000);

export default store;

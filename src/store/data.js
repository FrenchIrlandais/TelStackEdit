import Vue from 'vue';
import yaml from 'js-yaml';
import utils from '../services/utils';
import defaultSettings from '../data/defaults/defaultSettings.yml';
// import defaultLayoutState from '../data/defaults/defaultLayoutState'; TODO: pour l'instant je ne l'utilise pas, a voir , c'est ptet plus propre...
import plainHtmlTemplate from '../data/templates/plainHtmlTemplate.html';
import styledHtmlTemplate from '../data/templates/styledHtmlTemplate.html';
import styledHtmlWithTocTemplate from '../data/templates/styledHtmlWithTocTemplate.html';
import jekyllSiteTemplate from '../data/templates/jekyllSiteTemplate.html';
import constants from '../data/constants';

function templateConstructor(name, value, helpers = '\n') {
  return {
    name,
    value,
    helpers,
    isAdditional: true,
  };
}

const defaultTemplates = {
  plainText: templateConstructor('Plain text', '{{{files.0.content.text}}}'),
  plainHtml: templateConstructor('Plain HTML', plainHtmlTemplate),
  styledHtml: templateConstructor('Styled HTML', styledHtmlTemplate),
  styledHtmlWithToc: templateConstructor('Styled HTML with TOC', styledHtmlWithTocTemplate),
  jekyllSite: templateConstructor('Jekyll site', jekyllSiteTemplate),
};

function notEnoughSpace(layout) {
  const minimumRequiredWidth = layout.editorMinWidth + layout.explorerWidth + layout.sideBarWidth + layout.buttonBarWidth;
  return document.body.clientWidth < minimumRequiredWidth;
}

export default {
  namespaced: true,
  state: {
    // All items that must be saved in localStorage have an hash in order to detect changes.

    // Attention, les userSettings sont différent des defaultSettings, les userSettings ne font qu'override les defaultSettings !
    userSettings: {
      data: '\n',
      hash: 0,
    },

    layoutState: {
      showNavigationBar: true,
      showEditor: false,
      showSidePreview: true,
      showStatusBar: false,
      showSideBar: false,
      showExplorer: true,
      scrollSync: true,
      focusMode: false,
      findCaseSensitive: false,
      findUseRegexp: false,
      sideBarPanel: 'menu',
      filePropertiesTab: '',
      htmlExportTemplate: 'styledHtml',
      pdfExportTemplate: 'styledHtml',
      hash: 0,
    },

    // Additional templates
    userTemplates: {
      id: 'templates', // TODO est-ce bien si necessaire ?
      type: 'data', // TODO est-ce bien si necessaire ?
      data: undefined, // TODO rename byId or sth
      hash: 0,
    },

    lastOpened: {
      id: 'lastOpened', // TODO est-ce bien si necessaire ?
      type: 'data', // TODO est-ce bien si necessaire ?
      data: undefined,
      hash: 0,
    },

    // TODO ajouter Trash files !
  },
  mutations: {
    /**
    * In all mutations, do not forget to update hash !
    */

    // Load as an item with hash. We need to extract data. Used in load from localStorage.
    loadUserSettings: ({ userSettings }, item) => {
      userSettings.data = item.data;
      userSettings.hash = utils.getItemHash(userSettings); // Update hash
    },
    setUserSettings: ({ userSettings }, data) => {
      userSettings.data = data;
      userSettings.hash = utils.getItemHash(userSettings); // Update hash
    },
    // Patch: only override specified values. We do not "setLayoutState" in order to prevent data object corruption from localStorage
    patchLayoutState: ({ layoutState }, item) => {
      Object.assign(layoutState, item);
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },
    // If there is no value, show 'menu' as default
    setSideBarPanel: ({ layoutState }, value) => {
      layoutState.sideBarPanel = (value === undefined) ? 'menu' : value;
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },

    setTemplatesById: ({ userTemplates }, templatesById) => {
      const templatesToCommit = Object.assign({}, templatesById);
      // We don't store additional templates
      Object.keys(defaultTemplates).forEach((id) => {
        delete templatesToCommit[id];
      });
      userTemplates.data = templatesToCommit;
      userTemplates.hash = utils.getItemHash(userTemplates); // Update hash
    },

    // --
    // -- Toggle mutations: if value is set, set this specific value, otherwise toggle it.
    // --
    toggleNavigationBar: ({ layoutState }, value) => {
      layoutState.showNavigationBar = (value === undefined) ? !layoutState.showNavigationBar : value;
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },
    toggleEditor: ({ layoutState }, value) => {
      layoutState.showEditor = (value === undefined) ? !layoutState.showEditor : value;
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },
    toggleSidePreview: ({ layoutState }, value) => {
      layoutState.showSidePreview = (value === undefined) ? !layoutState.showSidePreview : value;
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },
    toggleStatusBar: ({ layoutState }, value) => {
      layoutState.showStatusBar = (value === undefined) ? !layoutState.showStatusBar : value;
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },
    toggleScrollSync: ({ layoutState }, value) => {
      layoutState.scrollSync = (value === undefined) ? !layoutState.scrollSync : value;
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },
    toggleFocusMode: ({ layoutState }, value) => {
      layoutState.focusMode = (value === undefined) ? !layoutState.focusMode : value;
      layoutState.hash = utils.getItemHash(layoutState); // Update hash
    },
  },
  getters: {
    userSettings: ({ userSettings }) => userSettings.data,
    // computedSettings are defaultSettings overriden by userSettings
    computedSettings: (state, { settings }) => {
      const customSettings = yaml.safeLoad(settings);
      const parsedSettings = yaml.safeLoad(defaultSettings);
      const override = (obj, opt) => { // TODO il ya deja une fonction d'override dans utils ?
        const objType = Object.prototype.toString.call(obj);
        const optType = Object.prototype.toString.call(opt);
        if (objType !== optType) {
          return obj;
        } else if (objType !== '[object Object]') {
          return opt;
        }
        Object.keys(obj).forEach((key) => {
          if (key === 'shortcuts') {
            obj[key] = Object.assign(obj[key], opt[key]);
          } else {
            obj[key] = override(obj[key], opt[key]);
          }
        });
        return obj;
      };
      return override(parsedSettings, customSettings);
    },
    layoutState: ({ layoutState }) => layoutState,
    templatesById: ({ userTemplates }) => userTemplates.data, // TODO mettre les templates en localStorage
    allTemplatesById: (state, { templatesById }) => {
      const result = {};
      Object.assign(result, templatesById);
      Object.assign(result, defaultTemplates);
      return result;
    },
    lastOpened: ({ lastOpened }) => lastOpened.data, // TODO: qui utilise ça et pk ? // TODO pk .data
    lastOpenedIds: (state, { lastOpened }, rootState) => { // TODO: qui utilise ça et pk ?
      const result = Object.assign({}, lastOpened);
      const currentFileId = rootState.fileInfo.currentId;
      if (currentFileId && !result[currentFileId]) {
        result[currentFileId] = Date.now();
      }
      return Object.keys(result)
        .filter(id => rootState.fileInfo.itemsById[id])
        .sort((id1, id2) => result[id2] - result[id1])
        .slice(0, 20);
    },
  },
  actions: {
    // TODO refacto, est-ce bien necessaire dans actions ?
    toggleSideBar: ({ getters, commit, rootGetters }, value) => {
      // Reset side bar
      commit('setSideBarPanel');

      // Toggle side bar
      const currentValue = getters.layoutState.showSideBar;
      commit('patchLayoutState', {
        showSideBar: (value === undefined) ? !currentValue : value,
      });

      // Close explorer if not enough space
      if (getters.layoutState.showSideBar && notEnoughSpace(rootGetters['layout/constants']) ) {
        commit('patchLayoutState', {
          showExplorer: false,
        });
      }
    },
    toggleExplorer: ({ getters, commit, rootGetters }, value) => {
      // Toggle explorer
      const currentValue = getters.layoutState.showExplorer;
      commit('patchLayoutState', {
        showExplorer: (value === undefined) ? !currentValue : value,
      });

      // Close side bar if not enough space
      if (getters.layoutState.showExplorer && notEnoughSpace(rootGetters['layout/constants']) ) {
        commit('patchLayoutState', {
          showSideBar: false,
        });
      }
    },
  },
};

import pagedownButtons from '../data/pagedownButtons';

let buttonCount = 2; // 2 buttons for undo/redo
let spacerCount = 0;
pagedownButtons.forEach((button) => {
  if (button.method) {
    buttonCount += 1;
  } else {
    spacerCount += 1;
  }
});

const minPadding = 25;
const editorTopPadding = 10;
const navigationBarEditButtonsWidth = (34 * buttonCount) + (8 * spacerCount); // buttons + spacers
const navigationBarLeftButtonWidth = 38 + 4 + 12;
const navigationBarRightButtonWidth = 38 + 8;
const navigationBarSpinnerWidth = 24 + 8 + 5; // 5 for left margin
const navigationBarSyncPublishButtonsWidth = 34 + 10;
const navigationBarTitleMargin = 8;
const maxTitleMaxWidth = 800;
const minTitleMaxWidth = 200;

const constants = {
  editorMinWidth: 320,
  explorerWidth: 260,
  gutterWidth: 250,
  sideBarWidth: 280,
  navigationBarHeight: 44,
  buttonBarWidth: 26,
  statusBarHeight: 20,
};

// TODO: commenter cette fonction
function computeStyles(state, getters, layoutState = getters['data/layoutState'], styles = {
  showNavigationBar: layoutState.showNavigationBar
    || !layoutState.showEditor
    || state.light, // TODO delete
  showStatusBar: layoutState.showStatusBar,
  showEditor: layoutState.showEditor,
  showSidePreview: layoutState.showSidePreview && layoutState.showEditor,
  showPreview: layoutState.showSidePreview || !layoutState.showEditor,
  showSideBar: layoutState.showSideBar && !state.light,
  showExplorer: layoutState.showExplorer && !state.light,
  layoutOverflow: false,
  hideLocations: state.light, // TODO delete ?
}) {
  styles.innerHeight = state.layout.bodyHeight;
  if (styles.showNavigationBar) {
    styles.innerHeight -= constants.navigationBarHeight;
  }
  if (styles.showStatusBar) {
    styles.innerHeight -= constants.statusBarHeight;
  }

  styles.innerWidth = state.layout.bodyWidth;
  if (styles.innerWidth < constants.editorMinWidth
    + constants.gutterWidth + constants.buttonBarWidth
  ) {
    styles.layoutOverflow = true;
  }
  if (styles.showSideBar) {
    styles.innerWidth -= constants.sideBarWidth;
  }
  if (styles.showExplorer) {
    styles.innerWidth -= constants.explorerWidth;
  }

  let doublePanelWidth = styles.innerWidth - constants.buttonBarWidth;
  if (doublePanelWidth < constants.editorMinWidth) {
    doublePanelWidth = constants.editorMinWidth;
  }

  if (styles.showSidePreview && doublePanelWidth / 2 < constants.editorMinWidth) {
    styles.showSidePreview = false;
    styles.showPreview = false;
    styles.layoutOverflow = false;
    return computeStyles(state, getters, layoutState, styles);
  }

  const computedSettings = getters['data/computedSettings'];
  styles.fontSize = 18;
  styles.textWidth = 990;
  if (doublePanelWidth < 1120) {
    styles.fontSize -= 1;
    styles.textWidth = 910;
  }
  if (doublePanelWidth < 1040) {
    styles.textWidth = 830;
  }
  styles.textWidth *= computedSettings.maxWidthFactor;
  if (doublePanelWidth < styles.textWidth) {
    styles.textWidth = doublePanelWidth;
  }
  if (styles.textWidth < 640) {
    styles.fontSize -= 1;
  }
  styles.fontSize *= computedSettings.fontSizeFactor;

  const bottomPadding = Math.floor(styles.innerHeight / 2);
  const panelWidth = Math.floor(doublePanelWidth / 2);
  styles.previewWidth = styles.showSidePreview ?
    panelWidth :
    doublePanelWidth;
  const previewRightPadding = Math
    .max(Math.floor((styles.previewWidth - styles.textWidth) / 2), minPadding);
  if (!styles.showSidePreview) {
    styles.previewWidth += constants.buttonBarWidth;
  }
  styles.previewGutterWidth = 0;
  const previewLeftPadding = previewRightPadding + styles.previewGutterWidth;
  styles.previewGutterLeft = previewLeftPadding - minPadding;
  styles.previewPadding = `${editorTopPadding}px ${previewRightPadding}px ${bottomPadding}px ${previewLeftPadding}px`;
  styles.editorWidth = styles.showSidePreview ?
    panelWidth :
    doublePanelWidth;
  const editorRightPadding = Math
    .max(Math.floor((styles.editorWidth - styles.textWidth) / 2), minPadding);
  styles.editorGutterWidth = 0;
  const editorLeftPadding = editorRightPadding + styles.editorGutterWidth;
  styles.editorGutterLeft = editorLeftPadding - minPadding;
  styles.editorPadding = `${editorTopPadding}px ${editorRightPadding}px ${bottomPadding}px ${editorLeftPadding}px`;

  styles.titleMaxWidth = styles.innerWidth -
    navigationBarLeftButtonWidth -
    navigationBarRightButtonWidth -
    navigationBarSpinnerWidth;
  if (styles.showEditor) {
    styles.titleMaxWidth -= navigationBarEditButtonsWidth +
      (navigationBarSyncPublishButtonsWidth * 2) +
      navigationBarTitleMargin;
    if (styles.titleMaxWidth + navigationBarEditButtonsWidth < minTitleMaxWidth) {
      styles.hideLocations = true;
    }
  }
  styles.titleMaxWidth = Math
    .max(minTitleMaxWidth, Math
      .min(maxTitleMaxWidth, styles.titleMaxWidth));
  return styles;
}

export default {
  namespaced: true,
  state: {
    canUndo: false,
    canRedo: false,
    bodyWidth: 0,
    bodyHeight: 0,
  },
  mutations: {
    setCanUndo: (state, value) => {
      state.canUndo = value;
    },
    setCanRedo: (state, value) => {
      state.canRedo = value;
    },
    updateBodySize: (state) => {
      state.bodyWidth = document.body.clientWidth;
      state.bodyHeight = document.body.clientHeight;
    },
  },
  getters: {
    constants: () => constants,
    styles: (state, getters, rootState, rootGetters) => computeStyles(rootState, rootGetters),
  },
  actions: {
    updateBodySize({ commit, dispatch, rootGetters }) {
      commit('updateBodySize');
      // Make sure both explorer and side bar are not open if body width is small
      const layoutState = rootGetters['data/layoutState'];
      dispatch('data/toggleExplorer', layoutState.showExplorer, { root: true });
    },
  },
};

export default {
  namespaced: true,
  state: {
    coordinates: {
      left: 0,
      top: 0,
    },
    items: [],
    resolve: () => {},
  },
  mutations: {
    setCoordinates: function(state, value) {
      state.coordinates = value;
    },
    setItems: function(state, value) {
      state.items = value;
    },
    setResolve: function(state, value) {
      state.resolve = value;
    },
  },
  actions: {
    open: function({ commit, rootState }, { coordinates, items }) {
      commit('setItems', items);
      // Place the context menu outside the screen
      commit('setCoordinates', { top: 0, left: -9999 });
      // Let the UI refresh itself
      setTimeout(() => {
        // Take the size of the context menu and place it
        const elt = document.querySelector('.context-menu__inner');
        if (elt) {
          const height = elt.offsetHeight;
          if (coordinates.top + height > rootState.layout.bodyHeight) {
            coordinates.top -= height;
          }
          if (coordinates.top < 0) {
            coordinates.top = 0;
          }
          const width = elt.offsetWidth;
          if (coordinates.left + width > rootState.layout.bodyWidth) {
            coordinates.left -= width;
          }
          if (coordinates.left < 0) {
            coordinates.left = 0;
          }
          commit('setCoordinates', coordinates);
        }
      }, 1);

      return new Promise(resolve => commit('setResolve', resolve));
    },
    close: function({ commit }) {
      commit('setItems', []);
      commit('setResolve', () => {});
    },
  },
};

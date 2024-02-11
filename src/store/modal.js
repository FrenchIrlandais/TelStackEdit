export default {
  namespaced: true,
  state: {
    stack: [],
  },
  mutations: {
    setStack: (state, value) => {
      state.stack = value;
    },
  },
  getters: {
    config: ({ stack }) => stack[0],
  },
  actions: {
    // deux types d'arguments:
    // Soit on passe une string 'htmlExport'
    // Soit on passe un objet qui contient { type: 'settings', ...}
    async open({ commit, state }, param) {
      const config = typeof param === 'object' ? Object.assign({}, param) : { type: param };
      try {
        return await new Promise((resolve, reject) => {
          config.resolve = resolve;
          config.reject = reject;
          state.stack.unshift(config); // Add at the beginning
          commit('setStack', state.stack); // We call commit for reactive mutation (in order to propagate to Vue)
        });
      } finally {
        commit('setStack', state.stack.filter((otherConfig => otherConfig !== config)));
      }
    },
  },
};

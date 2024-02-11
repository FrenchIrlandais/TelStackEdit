<template>
  <modal-inner aria-label="Insert link">
    <div class="modal__content">
      <p>Access to <b>{{rootRepoName}}</b> workspace is restricted.</p>
      <form-entry label="PASSWORD" error="password">
        <input slot="field" class="textfield" type="password" v-model.trim="password" @keydown.enter="resolve">
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <button class="button" @click="reject()">Cancel</button>
      <button class="button button--resolve" @click="resolve">Ok</button>
    </div>
  </modal-inner>
</template>

<script>
import modalFactory from './common/modalFactory';
import store from '../../store';

export default modalFactory({
  data: () => ({
    password: '',
  }),
  computed: {
    rootRepoName(){
      const map = store.getters['rootRepositories/map'];
      const repo = map[this.config.rootRepoUID];
      return (repo !== undefined)? repo.name : 'Unknown workspace';
    }
  },
  methods: {
    resolve(evt) {
      evt.preventDefault(); // Fixes https://github.com/benweet/stackedit/issues/1503
      if (!this.password) {
        this.setError('password');
      } else {
        const { callback } = this.config;
        this.config.resolve();
        callback(this.password);
      }
      this.password = ''; // Clean field. Note: le cleaning se fera pas dans le cas du reject avec la croix vu que cela est géré par le ModalInner
    },
    reject() {
      this.config.reject();
      this.password = ''; // Clean field
    },
  },
});
</script>

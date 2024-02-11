<template>
  <modal-inner class="modal__inner-1--workspace-management" aria-label="Manage workspaces">
    <div class="modal__content">
      <div class="flex flex--align-center">
        <div class="modal__image">
          <icon-database></icon-database>
        </div>
        <p>The following workspaces are accessible:</p>
      </div>
      <div class="workspace-all">
        <div class="workspace-entry" v-for="(workspace) in repos" :key="workspace.name">
          <a class="workspace-entry__header flex flex--row flex--align-center button" :class="{'button--resolve': workspace.focus}" @click="selectRootRepo(workspace.uid)" v-title="workspace.name">
            <div class="workspace-entry__icon">
              <icon-provider :provider-id="workspace.icon"></icon-provider>
            </div>
            <div class="workspace-entry__name">
              <div>{{workspace.name}}</div>
              <span>{{workspace.desc}}</span>
            </div>

            <!-- Old code
            <div class="workspace-entry__buttons flex flex--row">
              <button class="workspace-entry__button button" v-title="'Edit name'">
                <icon-pen></icon-pen>
              </button>
              <button class="workspace-entry__button button" v-title="'Remove'">
                <icon-delete></icon-delete>
              </button>
            </div>
            -->
          </a>
        </div>
      </div>
    </div>
    <div class="modal__button-bar">
      <button class="button button--resolve" @click="config.resolve()">Close</button>
    </div>
  </modal-inner>
</template>

<script>
import Vue from 'vue';
import ModalInner from './common/ModalInner';
import applicationSvc from '../../services/applicationSvc';
import store from '../../store';

export default {
  components: {
    ModalInner,
  },
  data: () => ({
  }),
  computed: {
    config(){ return store.getters['modal/config']; },
    repos(){
      const map = store.getters['rootRepositories/map'];
      const currentUID = store.getters['rootRepositories/currentUID'];
      let result = [];

      // icons: 'google-drive', 'google-photos', 'github', 'gitlab', 'blogger', 'couchdb'
      Object.entries(map).forEach(([uid, repo]) => {
        let element = {
          uid: uid,
          name: repo.name,
          icon: repo.icon,
          desc: repo.description
        };
        if(uid === currentUID){
          element.focus = true;
        }
        result.push(element);
      });

      return result;
    },
  },
  methods: {
    selectRootRepo(uid){
      applicationSvc.switchRootRepository(uid);
      this.config.resolve();
    }
  },
};
</script>

<style lang="scss">
@import '../../styles/variables.scss';

.modal__inner-1.modal__inner-1--workspace-management {
  max-width: 800px;
}

.workspace-all {
  display: flex;
  flex-wrap: wrap;
}

$button-size: 30px;
$small-button-size: 22px;

.workspace-entry {
  margin: 20px 10px;
  height: auto;
  font-size: 17px;
  line-height: 1.5;
  width: 200px;
}

.workspace-entry__header {
  line-height: normal;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  padding: 0px 16px;

  .text-input {
    border: 1px solid $link-color;
    padding: 0 5px;
    line-height: $button-size;
    height: $button-size;
  }
}

.workspace-entry__icon {
  height: 22px;
  width: 22px;
  margin-right: 0.75rem;
  flex: none;
}

.workspace-entry__name {
  text-align: left;
  text-transform: none;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: bold;
  padding: 10px 0px 2px 0px;

  span {
    display: inline-block;
    font-size: 0.75rem;
    opacity: 0.67;
    line-height: 1.3em;
    height: 2.6em; /* height is 2x line-height, so two lines will display */
    overflow: hidden; /* prevents extra lines from being visible */
    white-space: normal; /* override no wrap */
    font-weight: normal;
  }
}

</style>

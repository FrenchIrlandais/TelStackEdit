<template>
  <div class="explorer-node" :class="{'explorer-node--selected': isSelected, 'explorer-node--folder': node.isFolder, 'explorer-node--open': isOpen, 'explorer-node--trash': node.isTrash, 'explorer-node--temp': node.isTemp, 'explorer-node--drag-target': isDragTargetFolder}" @dragover.prevent @dragenter.stop="node.noDrop || setDragTarget(node)" @dragleave.stop="isDragTarget && setDragTarget()" @drop.prevent.stop="onDrop" @contextmenu="onContextMenu">
    <div class="explorer-node__item-editor" v-if="isEditing" :style="{paddingLeft: leftPadding}" draggable="true" @dragstart.stop.prevent>
      <input type="text" class="text-input" v-focus @blur="submitEdit()" @keydown.stop @keydown.enter="submitEdit()" @keydown.esc.stop="submitEdit(true)" v-model="editingNodeName">
    </div>
    <div class="explorer-node__item" v-else :style="{paddingLeft: leftPadding}" @click="select()" draggable="true" @dragstart.stop="setDragSourceId" @dragend.stop="setDragTarget()">
      {{node.item.name}}
      <icon-provider class="explorer-node__location" v-for="location in node.locations" :key="location.id" :provider-id="location.providerId"></icon-provider>
    </div>
    <div class="explorer-node__children" v-if="node.isFolder && isOpen">
      <explorer-node v-for="node in node.folders" :key="node.item.id" :node="node" :depth="depth + 1"></explorer-node>
      <div v-if="newChild" class="explorer-node__new-child" :class="{'explorer-node__new-child--folder': newChild.isFolder}" :style="{paddingLeft: childLeftPadding}">
        <input type="text" class="text-input" v-focus @blur="submitNewChild()" @keydown.stop @keydown.enter="submitNewChild()" @keydown.esc.stop="submitNewChild(true)" v-model.trim="newChildName">
      </div>
      <explorer-node v-for="node in node.files" :key="node.item.id" :node="node" :depth="depth + 1"></explorer-node>
    </div>
  </div>
</template>

<script>
import workspaceSvc from '../services/workspaceSvc';
import explorerSvc from '../services/explorerSvc';
import utils from '../services/utils';
import store from '../store';

export default {
  name: 'explorer-node', // Required for recursivity
  props: ['node', 'depth'],
  data: () => ({
    editingValue: '',
    submitionAvailable: true, // To prevent @blur and @keydown.enter to trigger 2 calls.
  }),
  computed: {
    leftPadding() { return `${this.depth * 15}px`; },
    childLeftPadding() { return `${(this.depth + 1) * 15}px`; },
    isSelected() { return store.getters['explorer/selectedNode'] === this.node; },
    isEditing() { return store.getters['explorer/editingNode'] === this.node; },
    isDragTarget() { return store.getters['explorer/dragTargetNode'] === this.node; },
    isDragTargetFolder() { return store.getters['explorer/dragTargetNodeFolder'] === this.node; },
    isOpen() { return store.state.explorer.openNodes[this.node.item.id] || this.node.isRoot; },
    newChild() { return store.getters['explorer/newChildNodeParent'] === this.node && store.state.explorer.newChildNode; },
    newChildName: {
      get() { return store.state.explorer.newChildNode.item.name; },
      set(value) { store.commit('explorer/setNewItemName', value); },
    },
    editingNodeName: {
      get() { return store.getters['explorer/editingNode'].item.name; },
      set(value) { this.editingValue = value.trim(); },
    },
  },
  methods: {
    setEditingId(value) { store.commit('explorer/setEditingId', value); },
    setDragTarget(node) { store.dispatch('explorer/setDragTarget', node); },
    select(id = this.node.item.id, doOpen = true) {
      const node = store.getters['explorer/nodeMap'][id];
      if (!node) {
        return false;
      }
      store.commit('explorer/setSelectedId', id); // TODO remove if in workspace
      if (doOpen) {
        // Prevent from freezing the UI while loading the file
        setTimeout(async () => {
          if (node.isFolder) {
            store.commit('explorer/toggleOpenNode', id);
          } else if (store.state.fileInfo.currentId !== id) {
            workspaceSvc.selectFile(id);
          }
        }, 10);
      }
      return true;
    },
    async asyncSubmitNewChild(cancel) {
      try {
        const { newChildNode } = store.state.explorer;
        if (!cancel && !newChildNode.isNil && newChildNode.item.name) {
          if (newChildNode.isFolder) {
            const item = await workspaceSvc.createFolder(newChildNode.item.name, newChildNode.item.parentId);
            this.select(item.id);
          } else {
            const item = await workspaceSvc.createFile(newChildNode.item.name, newChildNode.item.parentId); // TODO ya plein de truc useless dans newChileNode du coup
            this.select(item.id);
          }
        }
        store.commit('explorer/setNewItem', null);
      } catch (e) {
        // Cancel
      } finally {
        // release submition autorisation
        this.submitionAvailable = true;
      }
    },
    submitNewChild(cancel) {
      if(!this.submitionAvailable){
        return;
      }
      // take submition autorisation
      this.submitionAvailable = false;
      this.asyncSubmitNewChild(cancel); // needs to release the submition autorisation
    },
    async asyncSubmitEdit(cancel) {
      try {
        const { item } = store.getters['explorer/editingNode'];
        const value = this.editingValue;
        this.setEditingId(null);
        if (!cancel && item.id && value && item.name !== value) {
          await workspaceSvc.renameItem(item.id, value);
        }
      } catch (e) {
        // Cancel
      } finally {
        // release submition autorisation
        this.submitionAvailable = true;
      }
    },
    submitEdit(cancel) {
      if(!this.submitionAvailable){
        return;
      }
      // take submition autorisation
      this.submitionAvailable = false;
      this.asyncSubmitEdit(cancel); // needs to release the submition autorisation
    },
    setDragSourceId(evt) {
      if (this.node.noDrag) {
        evt.preventDefault();
        return;
      }
      store.commit('explorer/setDragSourceId', this.node.item.id);
      // Fix for Firefox
      // See https://stackoverflow.com/a/3977637/1333165
      evt.dataTransfer.setData('Text', '');
    },
    onDrop() {
      const sourceNode = store.getters['explorer/dragSourceNode'];
      const targetNode = store.getters['explorer/dragTargetNodeFolder'];
      this.setDragTarget();
      if (!sourceNode.isNil && !targetNode.isNil && sourceNode.item.id !== targetNode.item.id) {
        if(sourceNode.item.type === 'file') {
          workspaceSvc.moveFile(sourceNode.item.id, targetNode.item.id);
        } else if(sourceNode.item.type === 'folder') {
          workspaceSvc.moveFolder(sourceNode.item.id, targetNode.item.id);
        }
      }
    },
    async onContextMenu(evt) {
      if (this.select(undefined, false)) {
        evt.preventDefault();
        evt.stopPropagation();
        const item = await store.dispatch('contextMenu/open', {
          coordinates: {
            left: evt.clientX,
            top: evt.clientY,
          },
          items: [{
            name: 'New file',
            disabled: !this.node.isFolder || this.node.isTrash,
            perform: () => explorerSvc.newItem(false),
          }, {
            name: 'New folder',
            disabled: !this.node.isFolder || this.node.isTrash || this.node.isTemp,
            perform: () => explorerSvc.newItem(true),
          }, {
            type: 'separator',
          }, {
            name: 'Rename',
            disabled: this.node.isTrash || this.node.isTemp,
            perform: () => this.setEditingId(this.node.item.id),
          }, {
            name: 'Delete',
            perform: () => explorerSvc.deleteItem(),
          }],
        });
        if (item) {
          item.perform();
        }
      }
    },
  },
};
</script>

<style lang="scss">
$item-font-size: 14px;

.explorer-node--drag-target {
  background-color: rgba(0, 128, 255, 0.2);
}

.explorer-node__item {
  position: relative;
  cursor: pointer;
  font-size: $item-font-size;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 5px;

  .explorer-node--selected > & {
    background-color: rgba(0, 0, 0, 0.2);

    .explorer__tree:focus & {
      background-color: #39f;
      color: #fff;
    }
  }

  .explorer__tree--new-item & {
    opacity: 0.33;
  }

  .explorer-node__location {
    float: right;
    width: 18px;
    height: 18px;
    margin: 2px 1px;
  }
}

.explorer-node--trash,
.explorer-node--temp {
  color: rgba(0, 0, 0, 0.5);
}

.explorer-node--folder > .explorer-node__item,
.explorer-node--folder > .explorer-node__item-editor,
.explorer-node__new-child--folder {
  &::before {
    content: '▹';
    position: absolute;
    margin-left: -13px;
  }
}

.explorer-node--folder.explorer-node--open > .explorer-node__item,
.explorer-node--folder.explorer-node--open > .explorer-node__item-editor {
  &::before {
    content: '▾';
  }
}

$new-child-height: 25px;

.explorer-node__item-editor,
.explorer-node__new-child {
  padding: 1px 10px;

  .text-input {
    font-size: $item-font-size;
    padding: 2px;
    height: $new-child-height;
  }
}
</style>

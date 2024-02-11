import Vue from 'vue';
import fileInfoSvc from '../services/fileInfoSvc';
import folderInfoSvc from '../services/folderInfoSvc';

function debounceAction(action, wait) { // TODO c koa ?
  let timeoutId;
  return (context) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => action(context), wait);
  };
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
const compare = (node1, node2) => collator.compare(node1.item.name, node2.item.name);

class Node {
  constructor(item, locations = [], isFolder = false) {
    this.item = item;
    this.locations = locations; // TODO delete
    this.isFolder = isFolder;
    if (isFolder) {
      this.folders = [];
      this.files = [];
    }
  }

  sortChildren() {
    if (this.isFolder) {
      this.folders.sort(compare);
      this.files.sort(compare);
      this.folders.forEach(child => child.sortChildren());
    }
  }
}

const nilFileNode = new Node(fileInfoSvc.emptyFileInfoConstructor(null));
nilFileNode.isNil = true;
const fakeFileNode = new Node(fileInfoSvc.emptyFileInfoConstructor(null));
fakeFileNode.item.id = 'fake';
fakeFileNode.noDrag = true;

function getParent({ item, isNil }, { nodeMap, rootNode }) {
  if (isNil) {
    return nilFileNode;
  }
  return nodeMap[item.parentId] || rootNode;
}

function getFolder(node, getters) {
  return node.item.type === 'folder' ?
    node :
    getParent(node, getters);
}

export default {
  namespaced: true,
  state: {
    selectedId: null,
    editingId: null,
    dragSourceId: null,
    dragTargetId: null,
    newChildNode: nilFileNode,
    openNodes: {},
  },
  mutations: {
    setSelectedId: function(state, value) {
      state.selectedId = value;
    },
    setEditingId: function(state, value) {
      state.editingId = value;
    },
    setDragSourceId: function(state, value) {
      state.dragSourceId = value;
    },
    setDragTargetId: function(state, value) {
      state.dragTargetId = value;
    },
    setNewItem: function(state, item) {
      state.newChildNode = item ? new Node(item, [], item.type === 'folder') : nilFileNode;
    },
    setNewItemName: function(state, name) {
      state.newChildNode.item.name = name;
    },
    toggleOpenNode: function(state, id) {
      Vue.set(state.openNodes, id, !state.openNodes[id]);
    },
  },
  getters: {
    nodeStructure: function(state, getters, rootState, rootGetters) {
      const rootNode = new Node(folderInfoSvc.emptyFolderInfoConstructor(null), [], true);
      rootNode.isRoot = true;

      // Create Trash node
      const trashFolderNode = new Node(folderInfoSvc.emptyFolderInfoConstructor(null), [], true);
      trashFolderNode.item.id = 'trash';
      trashFolderNode.item.name = 'Trash';
      trashFolderNode.noDrag = true;
      trashFolderNode.isTrash = true;
      trashFolderNode.parentNode = rootNode;

      // Fill nodeMap with all file and folder nodes
      const nodeMap = {
        trash: trashFolderNode,
      };
      // add folders
      rootGetters['folder/items'].forEach((item) => {
        nodeMap[item.id] = new Node(item, [], true);
      });
      // add files
      rootGetters['fileInfo/items'].forEach((item) => {
        // TODO add location
        nodeMap[item.id] = new Node(item, []);
      });

      // Build the tree
      Object.entries(nodeMap).forEach(([, node]) => {
        let parentNode = nodeMap[node.item.parentId];
        if (!parentNode || !parentNode.isFolder) {
          if (node.isTrash) {
            return;
          }
          parentNode = rootNode;
        }
        if (node.isFolder) {
          parentNode.folders.push(node);
        } else {
          parentNode.files.push(node);
        }
        node.parentNode = parentNode;
      });
      rootNode.sortChildren();

      // Add Trash nodes
      rootNode.folders.unshift(trashFolderNode);

      // Add a fake file at the end of the root folder to allow drag and drop into it
      rootNode.files.push(fakeFileNode);
      return {
        nodeMap,
        rootNode,
      };
    },
    nodeMap: function(state, { nodeStructure }) {
      return nodeStructure.nodeMap;
    },
    rootNode: function(state, { nodeStructure }) {
      return nodeStructure.rootNode;
    },
    newChildNodeParent: function(state, getters) {
      return getParent(state.newChildNode, getters);
    },
    selectedNode: function({ selectedId }, { nodeMap }) {
      return nodeMap[selectedId] || nilFileNode;
    },
    selectedNodeFolder: function(state, getters) {
      return getFolder(getters.selectedNode, getters);
    },
    editingNode: function({ editingId }, { nodeMap }) {
      return nodeMap[editingId] || nilFileNode;
    },
    dragSourceNode: function({ dragSourceId }, { nodeMap }) {
      return nodeMap[dragSourceId] || nilFileNode;
    },
    dragTargetNode: function({ dragTargetId }, { nodeMap }) {
      if (dragTargetId === 'fake') {
        return fakeFileNode;
      }
      return nodeMap[dragTargetId] || nilFileNode;
    },
    dragTargetNodeFolder: ({ dragTargetId }, getters) => {
      if (dragTargetId === 'fake') {
        return getters.rootNode;
      }
      return getFolder(getters.dragTargetNode, getters);
    },
  },
  actions: {
    openNode: function({state, getters, commit, dispatch}, id) {
      const node = getters.nodeMap[id];
      if (node) {
        if (node.isFolder && !state.openNodes[id]) {
          commit('toggleOpenNode', id);
        }
        dispatch('openNode', node.item.parentId);
      }
    },
    openDragTarget: debounceAction(({ state, dispatch }) => {
      dispatch('openNode', state.dragTargetId);
    }, 1000),
    setDragTarget: function({ commit, getters, dispatch }, node) {
      if (!node) {
        commit('setDragTargetId');
      } else {
        // Make sure target node is not a child of source node
        const folderNode = getFolder(node, getters);
        const sourceId = getters.dragSourceNode.item.id;
        const { nodeMap } = getters;
        for (let parentNode = folderNode;
          parentNode;
          parentNode = nodeMap[parentNode.item.parentId]
        ) {
          if (parentNode.item.id === sourceId) {
            commit('setDragTargetId');
            return;
          }
        }

        commit('setDragTargetId', node.item.id);
        dispatch('openDragTarget');
      }
    },
  },
};

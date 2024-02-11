import DiffMatchPatch from 'diff-match-patch';
import cledit from './cledit';
import utils from '../utils';
import diffUtils from '../diffUtils';
import store from '../../store';

let clEditor;
// let discussionIds = {};
let discussionMarkers = {};
let markerKeys;
let markerIdxMap;
let previousPatchableText;
let currentPatchableText;
let isChangePatch;
let contentId;

function getDiscussionMarkers(discussion, discussionId, onMarker) {
  const getMarker = (offsetName) => {
    const markerKey = `${discussionId}:${offsetName}`;
    let marker = discussionMarkers[markerKey];
    if (!marker) {
      marker = new cledit.Marker(discussion[offsetName], offsetName === 'end');
      marker.discussionId = discussionId;
      marker.offsetName = offsetName;
      clEditor.addMarker(marker);
      discussionMarkers[markerKey] = marker;
    }
    onMarker(marker);
  };
  getMarker('start');
  getMarker('end');
}

function syncDiscussionMarkers(content, writeOffsets) {
  const discussions = content.discussions;
  Object.entries(discussionMarkers).forEach(([markerKey, marker]) => {
    // Remove marker if discussion was removed
    const discussion = discussions[marker.discussionId];
    if (!discussion) {
      clEditor.removeMarker(marker);
      delete discussionMarkers[markerKey];
    }
  });

  Object.entries(discussions).forEach(([discussionId, discussion]) => {
    getDiscussionMarkers(discussion, discussionId, writeOffsets
      ? (marker) => {
        discussion[marker.offsetName] = marker.offset;
      }
      : (marker) => {
        marker.offset = discussion[marker.offsetName];
      });
  });
}

function removeDiscussionMarkers() {
  Object.entries(discussionMarkers).forEach(([, marker]) => {
    clEditor.removeMarker(marker);
  });
  discussionMarkers = {};
  markerKeys = [];
  markerIdxMap = Object.create(null);
}

const diffMatchPatch = new DiffMatchPatch();

function makePatches() {
  const diffs = diffMatchPatch.diff_main(previousPatchableText, currentPatchableText);
  return diffMatchPatch.patch_make(previousPatchableText, diffs);
}

function applyPatches(patches) {
  const newPatchableText = diffMatchPatch.patch_apply(patches, currentPatchableText)[0];
  let result = newPatchableText;
  if (markerKeys.length) {
    // Strip text markers
    result = result.replace(new RegExp(`[\ue000-${String.fromCharCode((0xe000 + markerKeys.length) - 1)}]`, 'g'), '');
  }
  // Expect a `contentChanged` event
  if (result !== clEditor.getContent()) {
    previousPatchableText = currentPatchableText;
    currentPatchableText = newPatchableText;
    isChangePatch = true;
  }
  return result;
}

function reversePatches(patches) {
  const result = diffMatchPatch.patch_deepCopy(patches).reverse();
  result.forEach((patch) => {
    patch.diffs.forEach((diff) => {
      diff[0] = -diff[0];
    });
  });
  return result;
}

export default {
  createClEditor(editorElt) {
    this.clEditor = cledit(editorElt, editorElt.parentNode, true);
    ({ clEditor } = this);
    clEditor.on('contentChanged', (text) => {
      const oldContent = { // TODO, quesque ça fait ça au final ?
        text: store.getters['fileContent/getText'],
        properties: store.getters['fileContent/getProperties'],
        discussions: store.getters['fileContent/getDiscussions'],
        hash: store.getters['fileContent/getHash'],
      };
      const newContent = utils.deepCopy(oldContent);
      newContent.text = utils.sanitizeText(text);
      syncDiscussionMarkers(newContent, true);
      if (!isChangePatch) {
        previousPatchableText = currentPatchableText;
        currentPatchableText = diffUtils.makePatchableText(newContent, markerKeys, markerIdxMap);
      } else {
        // Take a chance to restore discussion offsets on undo/redo
        newContent.text = currentPatchableText;
        diffUtils.restoreDiscussionOffsets(newContent, markerKeys);
        syncDiscussionMarkers(newContent, false);
      }
      store.commit('fileContent/update', newContent);
      isChangePatch = false;
    });
    clEditor.on('focus', () => {});
  },
  initClEditorInternal(opts) {
    const content = { // TODO, quesque ça fait ça au final ?
      text: store.getters['fileContent/getText'],
      properties: store.getters['fileContent/getProperties'],
      discussions: store.getters['fileContent/getDiscussions'],
      hash: store.getters['fileContent/getHash'],
    };
    if (content) {
      removeDiscussionMarkers(); // Markers will be recreated on contentChanged
      const fileInfo = store.getters['fileInfo/current'];
      const options = Object.assign({
        selectionStart: fileInfo.selectionStart,
        selectionEnd: fileInfo.selectionEnd,
        patchHandler: {
          makePatches,
          applyPatches,
          reversePatches,
        },
      }, opts);

console.log("ça sert a quoi ça ?")
      //if (contentId !== content.id) {
      //  contentId = content.id;
        currentPatchableText = diffUtils.makePatchableText(content, markerKeys, markerIdxMap);
        previousPatchableText = currentPatchableText;
        syncDiscussionMarkers(content, false);
        options.content = content.text;
      // }

      clEditor.init(options);
    }
  },
  applyContent() {
    if (clEditor) {
      const content = { // TODO, quesque ça fait ça au final ?
        text: store.getters['fileContent/getText'],
        properties: store.getters['fileContent/getProperties'],
        discussions: store.getters['fileContent/getDiscussions'],
        hash: store.getters['fileContent/getHash'],
      };
      if (clEditor.setContent(content.text, true).range) {
        // Marker will be recreated on contentChange
        removeDiscussionMarkers();
      } else {
        syncDiscussionMarkers(content, false);
      }
    }
  },
};

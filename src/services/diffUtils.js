import DiffMatchPatch from 'diff-match-patch';
import utils from './utils';

const diffMatchPatch = new DiffMatchPatch();
diffMatchPatch.Match_Distance = 10000;

function makePatchableText(content, markerKeys, markerIdxMap) {
  if (!content || !content.discussions) {
    return null;
  }
  const markers = [];
  // Sort keys to have predictable marker positions in case of same offset
  const discussionKeys = Object.keys(content.discussions).sort();
  discussionKeys.forEach((discussionId) => {
    const discussion = content.discussions[discussionId];

    function addMarker(offsetName) {
      const markerKey = discussionId + offsetName;
      if (discussion[offsetName] !== undefined) {
        let idx = markerIdxMap[markerKey];
        if (idx === undefined) {
          idx = markerKeys.length;
          markerIdxMap[markerKey] = idx;
          markerKeys.push({
            id: discussionId,
            offsetName,
          });
        }
        markers.push({
          idx,
          offset: discussion[offsetName],
        });
      }
    }

    addMarker('start');
    addMarker('end');
  });

  let lastOffset = 0;
  let result = '';
  markers
    .sort((marker1, marker2) => marker1.offset - marker2.offset)
    .forEach((marker) => {
      result +=
        content.text.slice(lastOffset, marker.offset) +
        String.fromCharCode(0xe000 + marker.idx); // Use a character from the private use area
      lastOffset = marker.offset;
    });
  return result + content.text.slice(lastOffset);
}

function restoreDiscussionOffsets(content, markerKeys) {
  if (markerKeys.length) {
    // Go through markers
    let count = 0;
    content.text = content.text.replace(
      new RegExp(`[\ue000-${String.fromCharCode((0xe000 + markerKeys.length) - 1)}]`, 'g'),
      (match, offset) => {
        const idx = match.charCodeAt(0) - 0xe000;
        const markerKey = markerKeys[idx];
        const discussion = content.discussions[markerKey.id];
        if (discussion) {
          discussion[markerKey.offsetName] = offset - count;
        }
        count += 1;
        return '';
      },
    );
    // Sanitize offsets
    Object.keys(content.discussions).forEach((discussionId) => {
      const discussion = content.discussions[discussionId];
      if (discussion.start === undefined) {
        discussion.start = discussion.end || 0;
      }
      if (discussion.end === undefined || discussion.end < discussion.start) {
        discussion.end = discussion.start;
      }
    });
  }
}

export default {
  makePatchableText,
  restoreDiscussionOffsets,
};

import yaml from 'js-yaml';
import '../libs/clunderscore';
import presets from '../data/presets';
import constants from '../data/constants';

// For utils.uid()
const uidLength = 16;
const crypto = window.crypto || window.msCrypto;
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const radix = alphabet.length;
const array = new Uint32Array(uidLength);

// For utils.computeProperties()
const deepOverride = (obj, opt) => {
  if (obj === undefined) {
    return opt;
  }
  const objType = Object.prototype.toString.call(obj);
  const optType = Object.prototype.toString.call(opt);
  if (objType !== optType) {
    return obj;
  }
  if (objType !== '[object Object]') {
    return opt === undefined ? obj : opt;
  }

  Object.keys(opt).forEach((key) => {
    obj[key] = deepOverride(obj[key], opt[key]);
  });
  return obj;
};

const deepCopy = (obj) => {
  if (obj == null) {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
};

// Compute presets
const computedPresets = {};
Object.keys(presets).forEach((key) => {
  let preset = deepCopy(presets[key][0]);
  if (presets[key][1]) {
    preset = deepOverride(preset, presets[key][1]);
  }
  computedPresets[key] = preset;
});

export default {
  computedPresets,
  sanitizeText(text) {
    const result = `${text || ''}`.slice(0, constants.textMaxLength);
    // last char must be a `\n`.
    return `${result}\n`.replace(/\n\n$/, '\n');
  },
  sanitizeName(name) {
    return `${name || ''}`
      // Keep only 250 characters
      .slice(0, 250) || constants.defaultName;
  },
  sanitizeFilename(name) {
    return this.sanitizeName(`${name || ''}`
      // Replace `/`, control characters and other kind of spaces with a space
      .replace(/[/\x00-\x1F\x7f-\xa0\s]+/g, ' ') // eslint-disable-line no-control-regex
      .trim()) || constants.defaultName;
  },
  deepCopy,
  serializeObject(obj) {
    return obj === undefined ? obj : JSON.stringify(obj, (key, value) => {
      if (Object.prototype.toString.call(value) !== '[object Object]') {
        return value;
      }
      // Sort keys to have a predictable result
      return Object.keys(value).sort().reduce((sorted, valueKey) => {
        sorted[valueKey] = value[valueKey];
        return sorted;
      }, {});
    });
  },
  uid() {
    crypto.getRandomValues(array);
    return array.cl_map(value => alphabet[value % radix]).join('');
  },
  hash(str) {
    // https://stackoverflow.com/a/7616484/1333165
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i += 1) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char; // eslint-disable-line no-bitwise
      hash |= 0; // eslint-disable-line no-bitwise
    }
    return hash;
  },
  getItemHash(item) { // TODO refactor avec un Object.entries ? et exclude id/hash
    const itemForHash = Object.assign({}, item);
    // These properties must not be part of the hash
    itemForHash.id = undefined;
    itemForHash.hash = undefined;
    itemForHash.history = undefined;
    return this.hash(this.serializeObject(itemForHash));
  },
  addItemHash(item) {
    const newItem = Object.assign({}, item);
    newItem.hash = this.getItemHash(item);
    return newItem;
  },
  computeProperties(yamlProperties) {
    let properties = {};
    try {
      properties = yaml.safeLoad(yamlProperties) || {};
    } catch (e) {
      // Ignore
    }
    const extensions = properties.extensions || {};
    const computedPreset = deepCopy(computedPresets[extensions.preset] || computedPresets.default);
    const computedExtensions = deepOverride(computedPreset, properties.extensions);
    computedExtensions.preset = extensions.preset;
    properties.extensions = computedExtensions;
    return properties;
  },
  wrapRange(range, eltProperties, className) {
    const rangeLength = `${range}`.length;
    let wrappedLength = 0;
    const treeWalker = document
      .createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    let { startOffset } = range;
    treeWalker.currentNode = range.startContainer;
    if (treeWalker.currentNode.nodeType === Node.TEXT_NODE || treeWalker.nextNode()) {
      do {
        if (treeWalker.currentNode.nodeValue !== '\n') {
          if (treeWalker.currentNode === range.endContainer &&
            range.endOffset < treeWalker.currentNode.nodeValue.length
          ) {
            treeWalker.currentNode.splitText(range.endOffset);
          }
          if (startOffset) {
            treeWalker.currentNode = treeWalker.currentNode.splitText(startOffset);
            startOffset = 0;
          }
          const elt = document.createElement('span');
          Object.entries(eltProperties).forEach(([key, value]) => {
            elt[key] = value;
          });
          elt['className'] = className;
          treeWalker.currentNode.parentNode.insertBefore(elt, treeWalker.currentNode);
          elt.appendChild(treeWalker.currentNode);
        }
        wrappedLength += treeWalker.currentNode.nodeValue.length;
        if (wrappedLength >= rangeLength) {
          break;
        }
      }
      while (treeWalker.nextNode());
    }
  },
  unwrapRange(eltCollection) {
    Array.prototype.slice.call(eltCollection).forEach((elt) => {
      // Loop in case another wrapper has been added inside
      for (let child = elt.firstChild; child; child = elt.firstChild) {
        if (child.nodeType === 3) {
          if (elt.previousSibling && elt.previousSibling.nodeType === 3) {
            child.nodeValue = elt.previousSibling.nodeValue + child.nodeValue;
            elt.parentNode.removeChild(elt.previousSibling);
          }
          if (!child.nextSibling && elt.nextSibling && elt.nextSibling.nodeType === 3) {
            child.nodeValue += elt.nextSibling.nodeValue;
            elt.parentNode.removeChild(elt.nextSibling);
          }
        }
        elt.parentNode.insertBefore(child, elt);
      }
      elt.parentNode.removeChild(elt);
    });
  },
};

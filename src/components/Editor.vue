<template>
  <div class="editor">
    <pre class="editor__inner markdown-highlighting" :style="{padding: styles.editorPadding}" :class="{monospaced: computedSettings.editor.monospacedFontOnly}"></pre>
  </div>
</template>

<script>
import store from '../store';

export default {
  computed: {
    styles(){ return store.getters['layout/styles']; },
    computedSettings(){ return store.getters['data/computedSettings']; },
  },
};
</script>

<style lang="scss">
@import '../styles/variables.scss';

.editor {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.editor__inner {
  margin: 0;
  font-family: $font-family-main;
  font-variant-ligatures: no-common-ligatures;
  white-space: pre-wrap;
  word-break: break-word;
  word-wrap: break-word;

  * {
    line-height: $line-height-base;
  }

  .cledit-section {
    font-family: inherit;
  }

  .hide {
    display: none;
  }

  &.monospaced {
    font-family: $font-family-monospace !important;
    font-size: $font-size-monospace !important;

    * {
      font-size: inherit !important;
    }
  }
}
</style>

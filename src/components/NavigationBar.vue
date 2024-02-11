<template>
  <nav class="navigation-bar" :class="{'navigation-bar--editor': styles.showEditor, 'navigation-bar--light': light}">
    <!-- Explorer -->
    <div class="navigation-bar__inner navigation-bar__inner--left navigation-bar__inner--button">
      <button class="navigation-bar__button navigation-bar__button--close button" v-if="light" @click="close()" v-title="'Close StackEdit'"><icon-check-circle></icon-check-circle></button>
      <button class="navigation-bar__button navigation-bar__button--explorer-toggler button" v-else @click="toggleExplorer()" v-title="'Toggle explorer'"><icon-folder></icon-folder></button>
    </div>
    <!-- Side bar -->
    <div class="navigation-bar__inner navigation-bar__inner--right navigation-bar__inner--button">
      <a class="navigation-bar__button navigation-bar__button--stackedit button" v-if="light" href="app" target="_blank" v-title="'Open StackEdit'"><icon-provider provider-id="stackedit"></icon-provider></a>
      <button class="navigation-bar__button navigation-bar__button--stackedit button" v-else @click="toggleSideBar()" v-title="'Toggle side bar'"><icon-provider provider-id="stackedit"></icon-provider></button>
    </div>
    <div class="navigation-bar__inner navigation-bar__inner--right navigation-bar__inner--title flex flex--row">
      <!-- Title -->
      <div class="navigation-bar__title navigation-bar__title--fake text-input"></div>
      <div class="navigation-bar__title navigation-bar__title--text text-input" :style="{width: titleWidth + 'px'}">{{title}}</div>
      <input class="navigation-bar__title navigation-bar__title--input text-input" :class="{'navigation-bar__title--focus': titleFocus, 'navigation-bar__title--scrolling': titleScrolling}" :style="{width: titleWidth + 'px'}" @focus="editTitle(true)" @blur="editTitle(false)" @keydown.enter="submitTitle(false)" @keydown.esc.stop="submitTitle(true)" @mouseenter="titleHover = true" @mouseleave="titleHover = false" v-model="title">
      <!-- Sync/Publish -->
    </div>
    <div class="navigation-bar__inner navigation-bar__inner--edit-pagedownButtons">
      <button class="navigation-bar__button button" @click="undo" v-title="'Undo'" :disabled="!canUndo"><icon-undo></icon-undo></button>
      <button class="navigation-bar__button button" @click="redo" v-title="'Redo'" :disabled="!canRedo"><icon-redo></icon-redo></button>
      <div v-for="button in pagedownButtons" :key="button.method">
        <button class="navigation-bar__button button" v-if="button.method" @click="pagedownClick(button.method)" v-title="button.titleWithShortcut">
          <component :is="button.iconClass"></component>
        </button>
        <div class="navigation-bar__spacer" v-else></div>
      </div>
    </div>
  </nav>
</template>

<script>
import editorSvc from '../services/editorSvc';
import animationSvc from '../services/animationSvc';
import utils from '../services/utils';
import pagedownButtons from '../data/pagedownButtons';
import store from '../store';
import workspaceSvc from '../services/workspaceSvc';

// According to mousetrap
const mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'Meta' : 'Ctrl';

const getShortcut = (method) => {
  let result = '';
  Object.entries(store.getters['data/computedSettings'].shortcuts).some(([keys, shortcut]) => {
    if (`${shortcut.method || shortcut}` === method) {
      result = keys.split('+').map(key => key.toLowerCase()).map((key) => {
        if (key === 'mod') {
          return mod;
        }
        // Capitalize
        return key && `${key[0].toUpperCase()}${key.slice(1)}`;
      }).join('+');
    }
    return result;
  });
  return result && ` – ${result}`;
};

export default {
  data: () => ({
    mounted: false,
    title: '',
    titleFocus: false,
    titleHover: false,
  }),
  computed: {
    light(){ return store.state.light; },
    canUndo(){ return store.state.layout.canUndo; },
    canRedo(){ return store.state.layout.canRedo; },
    styles(){ return store.getters['layout/styles']; },
    pagedownButtons() {
      return pagedownButtons.map(button => {
        const modifiedButton = Object.assign({}, button);
        modifiedButton.titleWithShortcut = `${button.title}${getShortcut(button.method)}`;
        modifiedButton.iconClass = `icon-${button.icon}`;
        return modifiedButton;
      });
    },
    titleWidth() {
      if (!this.mounted) {
        return 0;
      }
      this.titleFakeElt.textContent = this.title;
      const width = this.titleFakeElt.getBoundingClientRect().width + 2; // 2px for the caret
      return Math.min(width, this.styles.titleMaxWidth);
    },
    titleScrolling() {
      const result = this.titleHover && !this.titleFocus;
      if (this.titleInputElt) {
        if (result) {
          const scrollLeft = this.titleInputElt.scrollWidth - this.titleInputElt.offsetWidth;
          animationSvc.animate(this.titleInputElt)
            .scrollLeft(scrollLeft)
            .duration(scrollLeft * 10)
            .easing('inOut')
            .start();
        } else {
          animationSvc.animate(this.titleInputElt)
            .scrollLeft(0)
            .start();
        }
      }
      return result;
    },
    editCancelTrigger() {
      const current = store.getters['fileInfo/current'];
      return utils.serializeObject([
        current.id,
        current.name,
      ]);
    },
  },
  methods: {
    toggleExplorer(){ store.dispatch('data/toggleExplorer', undefined); },
    toggleSideBar(){ store.dispatch('data/toggleSideBar', undefined); },
    undo() { return editorSvc.clEditor.undoMgr.undo(); },
    redo() { return editorSvc.clEditor.undoMgr.redo(); },
    pagedownClick(name) {
      if (store.getters['fileContent/isEditable']) {
        editorSvc.pagedownEditor.uiManager.doClick(name);
      }
    },
    async editTitle(toggle) {
      this.titleFocus = toggle;
      if (toggle) {
        this.titleInputElt.setSelectionRange(0, this.titleInputElt.value.length);
      } else {
        const title = this.title.trim();
        const id = store.getters['fileInfo/current'].id;
        this.title = store.getters['fileInfo/current'].name; // TODO why this.title ? en cas d'erreur ?
        if (title && this.title !== title) {
          try {
            await workspaceSvc.storeItem(id, title);
          } catch (e) {
            // Cancel
          }
        }
      }
    },
    submitTitle(reset) {
      if (reset) {
        this.title = '';
      }
      this.titleInputElt.blur();
    },
    close() {
      // TODO DELETE
    },
  },
  created() {
    this.$watch(
      () => this.editCancelTrigger,
      () => {
        this.title = '';
        this.editTitle(false);
      },
      { immediate: true },
    );
  },
  mounted() {
    this.titleFakeElt = this.$el.querySelector('.navigation-bar__title--fake');
    this.titleInputElt = this.$el.querySelector('.navigation-bar__title--input');
    this.mounted = true;
  },
};
</script>

<style lang="scss">
@import '../styles/variables.scss';

.navigation-bar {
  position: absolute;
  width: 100%;
  height: 100%;
  padding-top: 4px;
  overflow: hidden;
}

.navigation-bar__hidden {
  display: none;
}

.navigation-bar__inner--left {
  float: left;

  &.navigation-bar__inner--button {
    margin-right: 12px;
  }
}

.navigation-bar__inner--right {
  float: right;

  /* prevent from seeing wrapped pagedownButtons */
  margin-bottom: 20px;
}

.navigation-bar__inner--button {
  margin: 0 4px;
}

.navigation-bar__inner--edit-pagedownButtons {
  margin-left: 15px;

  .navigation-bar__button,
  .navigation-bar__spacer {
    float: left;
  }
}

.navigation-bar__inner--title * {
  flex: none;
}

.navigation-bar__button,
.navigation-bar__spacer {
  height: 36px;
  padding: 0 4px;

  /* prevent from seeing wrapped pagedownButtons */
  margin-bottom: 20px;
}

.navigation-bar__button {
  width: 34px;
  padding: 0 7px;
  transition: opacity 0.25s;

  .navigation-bar__inner--button & {
    padding: 0 4px;
    width: 38px;

    &.navigation-bar__button--stackedit {
      opacity: 0.85;

      &:active,
      &:focus,
      &:hover {
        opacity: 1;
      }
    }
  }
}

.navigation-bar__title {
  margin: 0 4px;
  font-size: 21px;
}

.navigation-bar__title,
.navigation-bar__button {
  display: inline-block;
  color: $navbar-color;
  background-color: transparent;
}

.navigation-bar__button--sync,
.navigation-bar__button--publish {
  padding: 0 6px;
  margin: 0 5px;
}

.navigation-bar__button[disabled] {
  &,
  &:active,
  &:focus,
  &:hover {
    color: $navbar-color;
  }
}

.navigation-bar__title--input,
.navigation-bar__button {
  &:active,
  &:focus,
  &:hover {
    color: $navbar-hover-color;
    background-color: $navbar-hover-background;
  }
}

.navigation-bar__button--location {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  padding: 2px;
  margin-top: 8px;
  opacity: 0.5;
  background-color: rgba(255, 255, 255, 0.2);

  &:active,
  &:focus,
  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.navigation-bar__button--blink {
  animation: blink 1s linear infinite;
}

.navigation-bar__title--fake {
  position: absolute;
  left: -9999px;
  width: auto;
  white-space: pre-wrap;
}

.navigation-bar__title--text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  .navigation-bar--editor & {
    display: none;
  }
}

.navigation-bar__title--input,
.navigation-bar__inner--edit-pagedownButtons {
  display: none;

  .navigation-bar--editor & {
    display: block;
  }
}

.navigation-bar__button {
  display: none;

  .navigation-bar__inner--button &,
  .navigation-bar--editor & {
    display: inline-block;
  }
}

.navigation-bar__button--close {
  color: lighten($link-color, 15%);

  &:active,
  &:focus,
  &:hover {
    color: lighten($link-color, 25%);
  }
}

.navigation-bar__title--input {
  cursor: pointer;

  &.navigation-bar__title--focus {
    cursor: text;
  }

  .navigation-bar--light & {
    display: none;
  }
}

$r: 10px;
$d: $r * 2;
$b: $d/10;
$t: 3000ms;

@keyframes blink {
  50% {
    opacity: 1;
  }
}
</style>

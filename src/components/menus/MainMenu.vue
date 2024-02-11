<template>
  <div class="side-bar__panel side-bar__panel--menu">
    <menu-entry @click.native="setPanel('toc')">
      <icon-toc slot="icon"></icon-toc>
      Table of contents
    </menu-entry>
    <menu-entry @click.native="fileProperties">
      <icon-view-list slot="icon"></icon-view-list>
      <div>File properties</div>
      <span>Add metadata and configure extensions.</span>
    </menu-entry>
    <hr>
    <menu-entry @click.native="setPanel('help')">
      <icon-help-circle slot="icon"></icon-help-circle>
      Markdown cheat sheet
    </menu-entry>
    <menu-entry @click.native="getSupportedLanguages">
      <icon-seal slot="icon"></icon-seal>
      <div>Supported languages</div>
      <span>Show code-block supported languages for syntax highlighting.</span>
    </menu-entry>
    <hr>
    <menu-entry @click.native="print">
      <icon-printer slot="icon"></icon-printer>
      Print
    </menu-entry>
    <menu-entry @click.native="exportHtml">
      <icon-download slot="icon"></icon-download>
      <div>Export as HTML</div>
      <span>Generate an HTML page from a template.</span>
    </menu-entry>
    <menu-entry @click.native="exportTemplates">
      <icon-code-braces slot="icon"></icon-code-braces>
      <div><div class="menu-entry__label menu-entry__label--count">{{templateCount}}</div> Manage templates</div>
      <span>Configure Handlebars templates for your exports.</span>
    </menu-entry>
    <hr>
    <menu-entry @click.native="manageWorkspaces">
      <icon-database slot="icon"></icon-database>
      <div>Manage workspaces</div>
      <span>Switch workspaces</span>
    </menu-entry>
    <menu-entry @click.native="settings">
      <icon-settings slot="icon"></icon-settings>
      <div>Settings</div>
      <span>Tweak application and keyboard shortcuts.</span>
    </menu-entry>
  </div>
</template>

<script>
import MenuEntry from './MenuEntry';
import store from '../../store';

export default {
  components: {
    MenuEntry,
  },
  computed: {
    templateCount() {
      return Object.keys(store.getters['data/allTemplatesById']).length;
    },
  },
  methods: {
    setPanel(tab){ store.commit('data/setSideBarPanel', tab); },
    async fileProperties() {
      try {
        await store.dispatch('modal/open', 'fileProperties');
      } catch (e) { /* Cancel */ }
    },
    print() {
      window.print();
    },
    async getSupportedLanguages() {
      try {
        await store.dispatch('modal/open', 'supportedLanguages');
      } catch (e) { /* Cancel */ }
    },
    async settings() {
      try {
        await store.dispatch('modal/open', 'settings');
      } catch (e) { /* Cancel */ }
    },
    async exportTemplates() {
      try {
        await store.dispatch('modal/open', 'exportTemplates');
      } catch (e) { /* Cancel */ }
    },
    async manageWorkspaces() {
      try {
        await store.dispatch('modal/open', 'workspaceManagement');
      } catch (e) { /* Cancel */ }
    },
    async exportHtml() {
      try {
        await store.dispatch('modal/open', 'htmlExport');
      } catch (e) { /* Cancel */ }
    },
  },
};
</script>

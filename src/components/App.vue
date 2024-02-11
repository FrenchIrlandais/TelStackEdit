<template>
  <div class="app" :class="classes">
    <splash-screen v-if="!ready"></splash-screen>
    <layout v-else></layout>
    <modal></modal>
    <context-menu></context-menu>
  </div>
</template>

<script>
import '../styles';
import '../styles/markdownHighlighting.scss';
import '../styles/app.scss';
import Layout from './Layout';
import Modal from './Modal';
import ContextMenu from './ContextMenu';
import SplashScreen from './SplashScreen';
import applicationSvc from '../services/applicationSvc';
import store from '../store';
import './common/vueGlobals';

const themeClasses = {
  light: ['app--light'],
  dark: ['app--dark'],
};

export default {
  components: {
    Layout,
    Modal,
    ContextMenu,
    SplashScreen,
  },
  data: () => ({
    ready: false, // For splash screen
  }),
  computed: {
    // Load UI themes
    classes() {
      const result = themeClasses[store.getters['data/computedSettings'].colorTheme];
      return Array.isArray(result) ? result : themeClasses.light;
    },
  },
  methods: {
  },
  async created() {
    applicationSvc.init(() => this.ready = true); // Hide splash screen when ready
  },
};
</script>

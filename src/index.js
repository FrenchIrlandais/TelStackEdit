import Vue from 'vue';
import './extensions';
import './services/optional';
import './icons';
import App from './components/App';
import store from './store';

// Les variables suivantes :
// - indexedDB
// - localStorage
// sont des variables natives de notre browser. Accessible n'importe ou, sur n'importe quelle page.
// Il suffit de tester indexedDB dans la console de notre navigateur sur une page vierge pour s'en assurer.
// localStorage quant à lui ne semble pas accessible depuis une page vierge, mais depuis une page web oui.
//
// Tests:
// - indexedDB.open("stackedit-db", 1);
//
// Sources:
// - https://developer.mozilla.org/fr/docs/Web/API/API_IndexedDB
// - https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage
// - https://softwareengineering.stackexchange.com/questions/219953/how-is-localstorage-different-from-indexeddb

/**
* Ajouter à l’écran d’accueil (A2HS en abrégé) est une fonctionnalité disponible
* dans les navigateurs pour smartphones modernes qui permet aux développeurs
* d’ajouter facilement et rapidement un raccourci à leur écran d’accueil,
* représentant leur application Web.
*
* Cela se fait en écoutant l'event: beforeinstallprompt
*/
if (!localStorage.installPrompted) {
  window.addEventListener('beforeinstallprompt', async (promptEvent) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    promptEvent.preventDefault();

    try {
      // 'Add StackEdit to your home screen?');
      promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (err) {
      // Cancel
    }
    localStorage.installPrompted = true;
  });
}

// Set this to false to prevent the production tip on Vue startup.
Vue.config.productionTip = false;

/**
* In order to have an access to this.$store property in your Vue components,
* you need to provide the created store to Vue instance. Vuex has a mechanism
* to "inject" the store into all child components from the root component with
* the store option:
*
*
*
* Cependant, ce modèle oblige le composant à compter sur le singleton global du
* store. Lorsqu'on utilise un système de module, il est nécessaire d'importer le
* store dans tous les composants qui utilisent l'état du store, et il est
* également nécessaire de le simuler lorsque l'on teste le composant.
*
* Vuex fournit un mécanisme pour « injecter » le store dans tous les composants
* enfants du composant racine avec l'option store (activée par Vue.use(Vuex))
*
* En fournissant l'option store à l'instance racine, le store sera injecté dans
* tous les composants enfants de la racine et sera disponible dans ces derniers
* avec this.$store.
*/
new Vue({
  el: '#app',
  store: store,
  render: h => h(App),
});

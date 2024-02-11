import ModalInner from './ModalInner';
import FormEntry from './FormEntry';
import store from '../../../store';

export default (component) => {
  // --
  // -- components
  // --
  // L'objet dataRef sera invoqué par la lambda fonction ci-dessous, à chaque fois qu'elle sera appelée...
  const dataRef = component.data ? component.data() : {};
  component.data = () => Object.assign(dataRef, {
    errorTimeouts: {},
  });

  // --
  // -- components
  // --
  if(!component.components){
    component.components = {};
  }
  component.components.ModalInner = ModalInner;
  component.components.FormEntry = FormEntry;

  // --
  // -- computed
  // --
  if(!component.computed){
    component.computed = {};
  }
  component.computed.config = function(){ return store.getters['modal/config']; };
  component.computed.currentFileName = function(){ return store.getters['fileInfo/current'].name; };

  // --
  // -- methods
  // --
  if(!component.methods){
    component.methods = {};
  }
  component.methods.openFileProperties = function(){ store.dispatch('modal/open', 'fileProperties'); };
  component.methods.setError = function(name){
    clearTimeout(this.errorTimeouts[name]);
    const formEntry = this.$el.querySelector(`.form-entry[error=${name}]`);
    if (formEntry) {
      formEntry.classList.add('form-entry--error');
      this.errorTimeouts[name] = setTimeout(() => {
        formEntry.classList.remove('form-entry--error');
      }, 1000);
    }
  };

  return component;
};

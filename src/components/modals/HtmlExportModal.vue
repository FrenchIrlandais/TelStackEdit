<template>
  <modal-inner aria-label="Export to HTML">
    <div class="modal__content">
      <p>Please choose a template for your <b>HTML export</b>.</p>
      <form-entry label="Template">
        <select class="textfield" slot="field" v-model="selectedTemplate" @keydown.enter="resolve()">
          <option v-for="(template, id) in allTemplatesById" :key="id" :value="id">
            {{ template.name }}
          </option>
        </select>
        <div class="form-entry__actions">
          <a href="javascript:void(0)" @click="configureTemplates">Configure templates</a>
        </div>
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <button class="button button--copy" v-clipboard="result" @click="info('HTML copied to clipboard!')">Copy</button>
      <button class="button" @click="config.reject()">Cancel</button>
      <button class="button button--resolve" @click="resolve()">Ok</button>
    </div>
  </modal-inner>
</template>

<script>
import exportSvc from '../../services/exportSvc';
import modalFactory from './common/modalFactory';
import store from '../../store';

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

export default modalFactory({
  data: () => ({
    result: '', // TODO ou est-ce qu'on voit le result ???
  }),
  computed: {
    selectedTemplate: {
      get() {
        return store.getters['data/layoutState'].htmlExportTemplate;
      },
      set(value) {
        store.commit('data/patchLayoutState', {
          htmlExportTemplate: value,
        });
      },
    },
    allTemplatesById: () => {
      const allTemplatesById = store.getters['data/allTemplatesById'];
      const sortedTemplatesById = {};
      Object.entries(allTemplatesById)
        .sort(([, template1], [, template2]) => collator.compare(template1.name, template2.name))
        .forEach(([templateId, template]) => {
          sortedTemplatesById[templateId] = template;
        });
      return sortedTemplatesById;
    }
  },
  mounted() {
    let timeoutId;
    this.$watch('selectedTemplate', (selectedTemplate) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const currentFileInfo = store.getters['fileInfo/current'];
        const currentFileText = store.getters['fileContent/getText'];
        const currentFileProperties = store.getters['fileContent/getProperties']; // TODO move in general properties ?
        const html = await exportSvc.applyTemplate(
          currentFileInfo,
          currentFileText,
          currentFileProperties,
          this.allTemplatesById[selectedTemplate],
        );
        this.result = html;
      }, 10);
    }, {
      immediate: true,
    });
  },
  methods: {
    info(text){
      console.log(text);
    },

    async resolve() {
      const { config } = this;
      const currentFileInfo = store.getters['fileInfo/current'];
      const currentFileText = store.getters['fileContent/getText'];
      const currentFileProperties = store.getters['fileContent/getProperties']; // TODO move in general properties ?
      config.resolve();
      await exportSvc.exportToDisk(
        currentFileInfo,
        currentFileText,
        currentFileProperties, 
        'html',
        this.allTemplatesById[this.selectedTemplate]);
    },

    async configureTemplates() {
      const { selectedId } = await store.dispatch('modal/open', {
        type: 'templates',
        selectedId: this.selectedTemplate,
      });
      store.commit('data/patchLayoutState', {
        htmlExportTemplate: selectedId,
      });
    },
  },
});
</script>

<template>
  <modal-inner aria-label="Supported Languages">
    <div class="flex flex--align-center">
      <div class="modal__image">
        <icon-seal></icon-seal>
      </div>
      <p>The following languages are supported for syntax highlighting in code block:</p>
    </div>
    <div class="modal__info modal__info--multiline">
      <div class="" v-for="language in supportedLanguages">
        <li><code>{{language.name}}</code><template v-for="alias in language.alias">,<code>{{alias}}</code></template></li>
      </div>
    </div>
    <div class="modal__button-bar">
      <button class="button button--resolve" @click="config.resolve()">Ok</button>
    </div>
  </modal-inner>
</template>

<script>
import modalFactory from './common/modalFactory';
import Prism from '../../services/prismWrapperSvc';

export default modalFactory({
  computed: {
    supportedLanguages: () => {
      const result = [];

      Object.entries(Prism.languages).forEach(([name, language]) => {
        let found = false;
        let i = 0;
        for (i = 0; i < result.length; i += 1) {
          if (result[i].language === language) {
            result[i].alias.push(name);
            found = true;
            break;
          }
        }
        if (!found) {
          result.push({ name, language, alias: [] });
        }
      });

      return result;
    },
  },
});
</script>

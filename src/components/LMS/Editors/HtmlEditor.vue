<template>
  <div class="glass-card q-pa-lg">
    <div class="row justify-between items-center q-mb-md">
      <div class="row items-center q-gutter-sm">
        <span class="badge badge-green">HTML/CSS Editor</span>
        <span class="text-caption text-red text-weight-bold">⚠️ Copy-Paste Disabled</span>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Editor Box -->
      <div class="col-12 col-md-6">
        <p class="text-label q-mb-xs">HTML & CSS Code</p>
        <div class="editor-container">
          <textarea
            v-model="htmlCode"
            class="code-textarea"
            placeholder="<h1>Hello World</h1>"
            spellcheck="false"
            :readonly="disabled"
            @copy.prevent="preventAction"
            @paste.prevent="preventAction"
            @cut.prevent="preventAction"
          ></textarea>
        </div>
      </div>

      <!-- Preview Box -->
      <div class="col-12 col-md-6">
        <p class="text-label q-mb-xs">LIVE PREVIEW</p>
        <div class="preview-container">
          <iframe :key="iframeKey" :srcdoc="previewSrcDoc" sandbox="allow-scripts" class="preview-iframe"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps({
  initialCode: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['change']);
const $q = useQuasar();

const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: sans-serif;
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, #007AFF, #FF3B30);
      color: white;
      height: 100vh;
      margin: 0;
    }
    h1 { margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is a live preview inside the iframe sandbox.</p>
</body>
</html>`;

const htmlCode = ref(props.initialCode || defaultHtml);
const previewSrcDoc = ref(htmlCode.value);
const iframeKey = ref(0);

watch(htmlCode, (newVal) => {
  emit('change', newVal);
  previewSrcDoc.value = newVal;
});

watch(() => props.initialCode, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    const targetVal = newVal || defaultHtml;
    if (targetVal !== htmlCode.value) {
      htmlCode.value = targetVal;
      previewSrcDoc.value = targetVal;
      iframeKey.value++;
    }
  }
});

const preventAction = () => {
  $q.notify({
    type: 'negative',
    message: 'Copying/Pasting is disabled in the HTML Editor.',
    position: 'top',
    timeout: 2000
  });
};
</script>

<style scoped>
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #1b1e24;
  overflow: hidden;
}

.code-textarea {
  width: 100%;
  height: 350px;
  font-family: monospace;
  font-size: 14px;
  background: #1b1e24;
  color: #abb2bf;
  border: none;
  padding: 16px;
  resize: none;
  outline: none;
  line-height: 1.5;
}

.preview-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: white;
  height: 382px;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>

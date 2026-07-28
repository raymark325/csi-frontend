<template>
  <div class="glass-card q-pa-lg">
    <div class="row justify-between items-center q-mb-md">
      <div class="row items-center q-gutter-sm">
        <span class="badge badge-green">HTML/CSS Editor</span>
        <span class="text-caption text-indigo-3 text-weight-bold" v-if="activeFileName">Editing: {{ activeFileName }}</span>
        <span class="text-caption text-red text-weight-bold">⚠️ Copy-Paste Disabled</span>
      </div>

      <!-- Preview Selector if multiple HTML files exist -->
      <div class="row items-center q-gutter-sm" v-if="htmlFileList.length > 1">
        <span class="text-caption text-grey-4">Preview Page:</span>
        <q-select
          v-model="previewPage"
          :options="htmlFileList"
          density="compact"
          dense
          dark
          options-dense
          outlined
          style="min-width: 140px;"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Editor Box -->
      <div class="col-12 col-md-6">
        <div class="row justify-between items-center q-mb-xs">
          <p class="text-label q-mb-none">{{ activeFileName || 'Code Editor' }}</p>
          <span class="text-caption text-grey-5">{{ getFileTypeLabel(activeFileName) }}</span>
        </div>
        <div class="editor-container">
          <textarea
            v-model="htmlCode"
            class="code-textarea"
            :placeholder="getPlaceholder(activeFileName)"
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
        <div class="row justify-between items-center q-mb-xs">
          <p class="text-label q-mb-none">LIVE PREVIEW ({{ previewPage }})</p>
          <q-btn flat round dense icon="refresh" size="sm" color="positive" @click="refreshIframe">
            <q-tooltip>Refresh Live Preview</q-tooltip>
          </q-btn>
        </div>
        <div class="preview-container">
          <iframe :key="iframeKey" :srcdoc="previewSrcDoc" sandbox="allow-scripts" class="preview-iframe"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps({
  initialCode: {
    type: String,
    default: ''
  },
  allFiles: {
    type: Array,
    default: () => []
  },
  allImages: {
    type: Array,
    default: () => []
  },
  activeFileName: {
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
  <meta charset="UTF-8">
  <title>My Web Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Welcome to your live HTML/CSS Code Lab project!</p>
  <script src="script.js"><\/script>
</body>
</html>`;

const htmlCode = ref(props.initialCode || defaultHtml);
const previewSrcDoc = ref('');
const iframeKey = ref(0);
const previewPage = ref('index.html');

const htmlFileList = computed(() => {
  if (!props.allFiles || props.allFiles.length === 0) return ['index.html'];
  const list = props.allFiles
    .filter(f => f.name.toLowerCase().endsWith('.html'))
    .map(f => f.name);
  return list.length > 0 ? list : ['index.html'];
});

const getFileTypeLabel = (name) => {
  if (!name) return 'Text File';
  if (name.endsWith('.html')) return 'HTML Document';
  if (name.endsWith('.css')) return 'CSS Stylesheet';
  if (name.endsWith('.js')) return 'JavaScript Source';
  return 'Source File';
};

const getPlaceholder = (name) => {
  if (!name) return 'Type code here...';
  if (name.endsWith('.html')) return '<h1>Hello World</h1>';
  if (name.endsWith('.css')) return 'body { background: #121212; color: #fff; }';
  if (name.endsWith('.js')) return 'console.log("Hello from script.js");';
  return 'Type code here...';
};

const refreshIframe = () => {
  previewSrcDoc.value = generatePreview();
  iframeKey.value++;
};

const generatePreview = () => {
  let filesToUse = [];
  if (props.allFiles && props.allFiles.length > 0) {
    filesToUse = props.allFiles.map(f => {
      if (f.name === props.activeFileName) {
        return { name: f.name, code: htmlCode.value };
      }
      return f;
    });
  } else {
    filesToUse = [{ name: props.activeFileName || 'index.html', code: htmlCode.value }];
  }

  // Find target HTML file to render
  const targetPageName = previewPage.value || 'index.html';
  let targetFile = filesToUse.find(f => f.name.toLowerCase() === targetPageName.toLowerCase());
  if (!targetFile) {
    targetFile = filesToUse.find(f => f.name.toLowerCase().endsWith('.html')) || { name: 'index.html', code: htmlCode.value };
  }

  let htmlContent = targetFile.code || '';

  // 1. Process and inline CSS files
  filesToUse.filter(f => f.name.toLowerCase().endsWith('.css')).forEach(cssFile => {
    const linkRegex = new RegExp(`<link[^>]*href=["'](?:\\.\\/|\\/)?${cssFile.name.replace('.', '\\.')}["'][^>]*>`, 'gi');
    if (linkRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(linkRegex, `<style>\n${cssFile.code}\n</style>`);
    } else {
      // If not linked explicitly, inject into head
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `<style>\n${cssFile.code}\n</style>\n</head>`);
      } else {
        htmlContent = `<style>\n${cssFile.code}\n</style>\n` + htmlContent;
      }
    }
  });

  // 2. Process and inline JS files
  filesToUse.filter(f => f.name.toLowerCase().endsWith('.js')).forEach(jsFile => {
    const scriptRegex = new RegExp(`<script[^>]*src=["'](?:\\.\\/|\\/)?${jsFile.name.replace('.', '\\.')}["'][^>]*>\\s*<\\/script>`, 'gi');
    if (scriptRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(scriptRegex, `<script>\n${jsFile.code}\n<\/script>`);
    } else {
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `<script>\n${jsFile.code}\n<\/script>\n</body>`);
      } else {
        htmlContent += `\n<script>\n${jsFile.code}\n<\/script>`;
      }
    }
  });

  // 3. Process Images & replace image paths with Base64 data URLs
  if (props.allImages && props.allImages.length > 0) {
    props.allImages.forEach(img => {
      if (!img || !img.name || !img.url) return;
      const escapedName = img.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace src="img.name", src="./img.name", src="/img.name"
      const srcRegex = new RegExp(`src=["'](?:\\.\\/|\\/)?${escapedName}["']`, 'gi');
      htmlContent = htmlContent.replace(srcRegex, `src="${img.url}"`);

      // Replace CSS url('img.name'), url("img.name"), url(img.name)
      const cssUrlRegex = new RegExp(`url\\(["']?(?:\\.\\/|\\/)?${escapedName}["']?\\)`, 'gi');
      htmlContent = htmlContent.replace(cssUrlRegex, `url("${img.url}")`);
    });
  }

  return htmlContent;
};

watch([htmlCode, () => props.allFiles, () => props.allImages, previewPage], () => {
  emit('change', htmlCode.value);
  previewSrcDoc.value = generatePreview();
}, { deep: true, immediate: true });

watch(() => props.initialCode, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    const targetVal = newVal || defaultHtml;
    if (targetVal !== htmlCode.value) {
      htmlCode.value = targetVal;
      previewSrcDoc.value = generatePreview();
      iframeKey.value++;
    }
  }
});

watch(() => props.activeFileName, (newName) => {
  if (newName && newName.toLowerCase().endsWith('.html')) {
    previewPage.value = newName;
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

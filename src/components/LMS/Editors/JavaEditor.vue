<template>
  <div class="glass-card q-pa-lg">
    <div class="row justify-between items-center q-mb-md">
      <div class="row items-center q-gutter-sm">
        <span class="badge badge-blue">Java Sandbox</span>
        <span class="text-caption text-red text-weight-bold">⚠️ Copy-Paste Disabled</span>
      </div>
      <q-btn color="primary" icon="play_arrow" label="Run Code" rounded unelevated :loading="isRunning" @click="runCode(false)"/>
    </div>

    <!-- Code Editor Box -->
    <div class="editor-container">
      <textarea
        v-model="code"
        class="code-textarea"
        placeholder="public class Main { ... }"
        spellcheck="false"
        :readonly="disabled"
        @keydown.tab.prevent="insertTab"
        @copy.prevent="preventAction"
        @paste.prevent="preventAction"
        @cut.prevent="preventAction"
      ></textarea>
    </div>

    <!-- Unified Console Box -->
    <div class="output-console q-mt-md">
      <div class="row justify-between items-center q-mb-xs">
        <p class="text-label text-white q-mb-none">CONSOLE</p>
        <span v-if="isRunning && !isWaitingForInput" class="text-caption text-grey-4">Running...</span>
        <span v-else-if="isWaitingForInput" class="text-caption text-amber text-weight-bold" style="font-size: 11px;">⚠️ (Program waiting for input. Click console below to type)</span>
        <span v-else class="text-caption text-grey-5" style="font-size: 11px;">(Console output)</span>
      </div>
      
      <!-- Console Content -->
      <div class="console-content" @click="focusConsole" style="position: relative;">
        <pre
          class="console-text"
        ><span>{{ output || 'Console ready. Click Run Code to execute.' }}</span><span class="user-typed-input">{{ currentInput }}</span><span v-if="consoleFocused && isWaitingForInput" class="console-cursor">_</span></pre>
        <input 
          ref="consoleInputRef"
          v-model="currentInput"
          type="text"
          class="hidden-mobile-input"
          @keydown.enter.prevent="submitMobileInput"
          @focus="consoleFocused = true"
          @blur="consoleFocused = false"
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
        />
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
  allFiles: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['change']);
const $q = useQuasar();

const defaultCode = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

const code = ref(props.initialCode || defaultCode);

const isRunning = ref(false);
const output = ref(null);
const stdin = ref('');
const currentInput = ref('');
const consoleFocused = ref(false);
const consoleInputRef = ref(null);
const isWaitingForInput = ref(false);

const focusConsole = () => {
  if (isWaitingForInput.value && consoleInputRef.value) {
    consoleInputRef.value.focus();
  }
};

// Global input resolver callback
let resolveInputPromise = null;

const submitMobileInput = (e) => {
  if (props.disabled || !isRunning.value || !isWaitingForInput.value) return;
  const val = currentInput.value;
  currentInput.value = '';
  if (resolveInputPromise) {
    resolveInputPromise(val);
  }
};

const insertTab = (e) => {
  const start = e.target.selectionStart;
  const end = e.target.selectionEnd;
  code.value = code.value.substring(0, start) + "    " + code.value.substring(end);
  // Put cursor after tab
  setTimeout(() => {
    e.target.selectionStart = e.target.selectionEnd = start + 4;
  }, 0);
};

const preventAction = (e) => {
  $q.notify({
    type: 'negative',
    message: 'Copying/Pasting is disabled in the Coding Lab.',
    position: 'top',
    timeout: 2000
  });
};

const runCode = async () => {
  isRunning.value = true;
  output.value = 'Compiling Java...\n';
  currentInput.value = '';
  isWaitingForInput.value = false;
  resolveInputPromise = null;

  setTimeout(async () => {
    let rawCode = code.value;
    if (props.allFiles && props.allFiles.length > 0) {
      rawCode = props.allFiles.map(f => f.code).join('\n\n');
    }

    // 1. Parse main method body
    const mainStart = rawCode.indexOf('public static void main');
    if (mainStart === -1) {
      output.value = "Compilation Error: main method not found. Ensure class contains:\npublic static void main(String[] args)";
      isRunning.value = false;
      return;
    }
    const bodyStart = rawCode.indexOf('{', mainStart);
    if (bodyStart === -1) {
      output.value = "Compilation Error: main method opening brace '{' not found";
      isRunning.value = false;
      return;
    }
    let braceCount = 1;
    let bodyEnd = -1;
    for (let i = bodyStart + 1; i < rawCode.length; i++) {
      if (rawCode[i] === '{') braceCount++;
      else if (rawCode[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          bodyEnd = i;
          break;
        }
      }
    }
    if (bodyEnd === -1) {
      output.value = "Compilation Error: main method mismatched braces";
      isRunning.value = false;
      return;
    }
    const mainBody = rawCode.substring(bodyStart + 1, bodyEnd);

    // 2. Translate Java code inside main to JavaScript
    let jsCode = mainBody;

    // Strip imports (Java syntax imports interfere with JS module structure)
    jsCode = jsCode.replace(/import\s+[\w\.]+;/g, '');

    // Translate declarations
    jsCode = jsCode.replace(/\b(int|double|float|String|boolean|char)\b/g, 'let');

    // Remove Scanner instantiations
    jsCode = jsCode.replace(/\bScanner\s+[a-zA-Z0-9_]+\s*=\s*new\s+Scanner\s*\(.*?\)\s*;/g, '');

    // System.out.println & System.out.print translations
    jsCode = jsCode.replace(/System\.out\.println\s*\(([\s\S]*?)\)\s*;/g, 'print($1);\n');
    jsCode = jsCode.replace(/System\.out\.print\s*\(([\s\S]*?)\)\s*;/g, 'printNoNewline($1);\n');
    jsCode = jsCode.replace(/System\.out\.printf\s*\(([\s\S]*?)\)\s*;/g, 'printNoNewline($1);\n');

    // Replace Scanner calls with await readInput promises
    jsCode = jsCode.replace(/[a-zA-Z0-9_]+\.nextInt\s*\(\)/g, "await readInput('int')");
    jsCode = jsCode.replace(/[a-zA-Z0-9_]+\.nextDouble\s*\(\)/g, "await readInput('double')");
    jsCode = jsCode.replace(/[a-zA-Z0-9_]+\.next\s*\(\)/g, "await readInput('string')");
    jsCode = jsCode.replace(/[a-zA-Z0-9_]+\.nextLine\s*\(\)/g, "await readInput('line')");

    // Replace String length methods
    jsCode = jsCode.replace(/\.length\s*\(\)/g, '.length');

    output.value = ''; // Clear compilation logs

    // 3. Define local runtime helpers
    const print = (val) => {
      output.value += (val !== undefined ? val : '') + '\n';
    };

    const printNoNewline = (val) => {
      output.value += (val !== undefined ? val : '');
    };

    const readInput = (type) => {
      isWaitingForInput.value = true;
      setTimeout(() => {
        focusConsole();
      }, 50);

      return new Promise((resolve) => {
        resolveInputPromise = (val) => {
          isWaitingForInput.value = false;
          // Echo typed input to terminal
          output.value += val + '\n';

          if (type === 'int') {
            resolve(parseInt(val) || 0);
          } else if (type === 'double') {
            resolve(parseFloat(val) || 0.0);
          } else {
            resolve(val);
          }
        };
      });
    };

    // 4. Execute function
    try {
      const execFunction = new Function('print', 'printNoNewline', 'readInput', `
        return (async () => {
          ${jsCode}
        })();
      `);

      await execFunction(print, printNoNewline, readInput);
      output.value += '\nProcess finished with exit code 0';
    } catch (err) {
      output.value += '\nRuntime Error: ' + err.message;
    } finally {
      isRunning.value = false;
      isWaitingForInput.value = false;
    }
  }, 100);
};

// Watcher to emit editor changes for real-time autosaving
watch(code, (newVal) => {
  emit('change', newVal);
});

watch(() => props.initialCode, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    const targetVal = newVal || defaultCode;
    if (targetVal !== code.value) {
      code.value = targetVal;
    }
  }
});
</script>

<style scoped>
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #1e1e1e;
  overflow: hidden;
}

.code-textarea {
  width: 100%;
  height: 300px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  padding: 16px;
  resize: vertical;
  outline: none;
  line-height: 1.5;
}

.output-console {
  background: #0f141d;
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.console-content {
  min-height: 100px;
  max-height: 250px;
  overflow-y: auto;
}

.console-text {
  font-family: monospace;
  color: #5af78e;
  margin: 0;
  white-space: pre-wrap;
  cursor: text;
}

.console-text:focus {
  outline: none;
}

.user-typed-input {
  color: #ffaa00;
  font-weight: bold;
}

.console-cursor {
  animation: blink 1s step-end infinite;
  color: #5af78e;
  font-weight: bold;
}

.hidden-mobile-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  top: 0;
  left: 0;
  border: none;
  padding: 0;
  margin: 0;
  pointer-events: none;
}

@keyframes blink {
  from, to { color: transparent }
  50% { color: #5af78e }
}
</style>

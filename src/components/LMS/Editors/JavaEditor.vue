<template>
  <div class="glass-card q-pa-lg">
    <div class="row justify-between items-center q-mb-md">
      <div class="row items-center q-gutter-sm">
        <span class="badge badge-blue">Java Sandbox</span>
        <span class="text-caption text-red text-weight-bold">⚠️ Copy-Paste Disabled</span>
      </div>
      <q-btn color="primary" icon="play_arrow" label="Run Code" rounded unelevated :loading="isRunning" @click="runCode"/>
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

    <!-- Console Output -->
    <div v-if="output !== null" class="output-console q-mt-md">
      <p class="text-label text-white q-mb-xs">CONSOLE OUTPUT</p>
      <pre class="console-text">{{ output }}</pre>
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

const defaultCode = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

const code = ref(props.initialCode || defaultCode);

const isRunning = ref(false);
const output = ref(null);

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

const runCode = () => {
  isRunning.value = true;
  output.value = 'Compiling Java...\n';
  setTimeout(() => {
    const rawCode = code.value;
    
    // 1. Bracket Matching Check
    const stack = [];
    const brackets = { '{': '}', '(': ')', '[': ']' };
    const opening = Object.keys(brackets);
    const closing = Object.values(brackets);
    
    let lineNum = 1;
    let bracketError = null;
    
    for (let i = 0; i < rawCode.length; i++) {
      const char = rawCode[i];
      if (char === '\n') {
        lineNum++;
      }
      if (opening.includes(char)) {
        stack.push({ char, line: lineNum });
      } else if (closing.includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last.char] !== char) {
          bracketError = `Compilation Error: mismatched bracket '${char}' at line ${lineNum}`;
          break;
        }
      }
    }
    
    if (!bracketError && stack.length > 0) {
      const last = stack.pop();
      bracketError = `Compilation Error: unclosed bracket '${last.char}' opened at line ${last.line}`;
    }
    
    if (bracketError) {
      output.value = bracketError;
      isRunning.value = false;
      return;
    }
    
    // 2. Strict Semicolon Check
    const lines = rawCode.split('\n');
    for (let l = 0; l < lines.length; l++) {
      let line = lines[l].trim();
      // Skip empty, comment, class headers, block openings, block closings
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;
      
      // Remove inline comments for semicolon validation
      const commentIdx = line.indexOf('//');
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx).trim();
      }

      if (line.startsWith('public class') || line.startsWith('class') || line.startsWith('public static void main')) continue;
      if (line.endsWith('{') || line.endsWith('}') || line.endsWith(';')) continue;
      
      // If it looks like a statement (variable decl, print, assignments, imports, etc.)
      if (line.includes('System.out') || line.includes('int ') || line.includes('String ') || line.includes('double ') || line.includes('boolean ') || line.includes('=') || line.includes('return') || line.includes('import ')) {
        output.value = `Compilation Error: ';' expected at line ${l + 1}\n    ${lines[l].trim()}`;
        isRunning.value = false;
        return;
      }
    }
    
    // 3. System.out.println print validation
    const printMatches = rawCode.match(/System\.out\.println/g) || [];
    const validPrintPattern = /System\.out\.println\s*\((.*?)\)\s*;/g;
    const validPrintMatches = [...rawCode.matchAll(validPrintPattern)];
    
    if (printMatches.length !== validPrintMatches.length) {
      output.value = `Compilation Error: invalid syntax for System.out.println. Check parentheses and semicolon.`;
      isRunning.value = false;
      return;
    }
    
    // Extract stdout prints
    if (validPrintMatches.length > 0) {
      output.value = validPrintMatches.map(m => {
        const content = m[1].trim();
        if (content.startsWith('"') && content.endsWith('"')) {
          return content.substring(1, content.length - 1);
        }
        return content;
      }).join('\n');
    } else {
      output.value = 'Build successful.\nProcess finished with exit code 0';
    }
    isRunning.value = false;
  }, 1000);
};

// Watcher to emit editor changes for real-time autosaving
watch(code, (newVal) => {
  emit('change', newVal);
});

watch(() => props.initialCode, (newVal) => {
  if (newVal && newVal !== code.value) {
    code.value = newVal;
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
}

.console-text {
  font-family: monospace;
  color: #5af78e;
  margin: 0;
  white-space: pre-wrap;
}
</style>

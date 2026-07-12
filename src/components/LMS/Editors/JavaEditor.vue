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
          v-show="isWaitingForInput"
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

// ── Java → JavaScript Transpiler ─────────────────────────────────────────────
// Translates Java OOP source code (classes, constructors, fields, this, methods)
// into executable JavaScript that runs in a sandboxed async Function context.

/**
 * Remove single-line and multi-line comments from Java source.
 */
const stripComments = (src) => {
  // Remove block comments /* ... */
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove line comments // ...
  src = src.replace(/\/\/[^\n]*/g, '');
  return src;
};

/**
 * Remove import and package statements.
 */
const stripImports = (src) => {
  src = src.replace(/^\s*import\s+[\w\.]+(\.\*)?\s*;/gm, '');
  src = src.replace(/^\s*package\s+[\w\.]+\s*;/gm, '');
  return src;
};

/**
 * Given a source string and an opening brace index,
 * return the index of the matching closing brace.
 */
const findMatchingBrace = (src, openIdx) => {
  let depth = 1;
  for (let i = openIdx + 1; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/**
 * Translate Java type declarations to JS `let` bindings.
 * Handles: int, double, float, long, short, byte, boolean, char, String, var,
 *          arrays (int[]), generic collections (List<...>, Map<...>), class names.
 * Only touches declarations — does NOT mangle `this.`, method signatures, etc.
 */
const translateTypes = (code) => {
  // Primitive and common types (including arrays): replace type in declaration context
  const primitiveTypes = [
    'int', 'double', 'float', 'long', 'short', 'byte', 'boolean', 'char',
    'String', 'var', 'Object'
  ];
  const typePattern = primitiveTypes.join('|');

  // "type varname" or "type[] varname" or "type varname =" — in statement position
  // Use a regex that only matches at start-of-statement (after ; { } or newline)
  code = code.replace(
    new RegExp(`(?<=[;{}\\n\\(,]\\s*)(?:(?:${typePattern})(?:\\s*\\[\\])*|(?:[A-Z][\\w]*(?:<[^>]*>)?(?:\\s*\\[\\])*))(?=\\s+[a-z_$][\\w$]*)`, 'g'),
    'let'
  );

  // for-loop declarations: for (int i = 0; ...)
  code = code.replace(
    new RegExp(`\\bfor\\s*\\(\\s*(?:${typePattern})(?:\\s*\\[\\])*`, 'g'),
    'for (let'
  );

  // Enhanced for-each: for (String s : list) → for (let s of list)
  code = code.replace(
    new RegExp(`\\bfor\\s*\\(\\s*(?:${typePattern}|[A-Z][\\w]*)(?:\\s*\\[\\])?\\s+([a-z_$][\\w$]*)\\s*:\\s*`, 'g'),
    'for (let $1 of '
  );

  return code;
};

/**
 * Translate common Java built-in calls and idioms to JavaScript equivalents.
 */
const translateBuiltins = (code) => {
  // System.out.println / print / printf
  code = code.replace(/System\.out\.println\s*\(/g, '__print__(');
  code = code.replace(/System\.out\.print\s*\(/g, '__printInline__(');
  code = code.replace(/System\.out\.printf\s*\(/g, '__printInline__(');
  code = code.replace(/System\.err\.println\s*\(/g, '__print__(');

  // Math functions map directly (JS Math is mostly compatible)
  // Math.pow, Math.sqrt, Math.abs, Math.max, Math.min, Math.floor, Math.ceil, Math.round — same
  // Math.PI, Math.E — same

  // String methods: Java .length() → JS .length
  code = code.replace(/\.length\s*\(\s*\)/g, '.length');

  // String.valueOf(x) → String(x)
  code = code.replace(/\bString\.valueOf\s*\(/g, 'String(');

  // Integer.parseInt, Double.parseDouble
  code = code.replace(/\bInteger\.parseInt\s*\(/g, 'parseInt(');
  code = code.replace(/\bDouble\.parseDouble\s*\(/g, 'parseFloat(');
  code = code.replace(/\bFloat\.parseFloat\s*\(/g, 'parseFloat(');
  code = code.replace(/\bLong\.parseLong\s*\(/g, 'parseInt(');
  code = code.replace(/\bInteger\.toString\s*\(/g, 'String(');
  code = code.replace(/\bInteger\.MAX_VALUE\b/g, 'Number.MAX_SAFE_INTEGER');
  code = code.replace(/\bInteger\.MIN_VALUE\b/g, 'Number.MIN_SAFE_INTEGER');

  // Arrays.toString(arr) → arr.join(', ')
  code = code.replace(/\bArrays\.toString\s*\(([^)]+)\)/g, '($1).join(", ")');
  code = code.replace(/\bArrays\.sort\s*\(([^)]+)\)/g, '$1.sort((a,b)=>a-b)');

  // ArrayList / List operations (basic)
  // new ArrayList<>() → []
  code = code.replace(/new\s+ArrayList\s*<[^>]*>\s*\(\s*\)/g, '[]');
  code = code.replace(/new\s+LinkedList\s*<[^>]*>\s*\(\s*\)/g, '[]');
  code = code.replace(/\.add\s*\(/g, '.push(');
  code = code.replace(/\.get\s*\(\s*(\w+)\s*\)/g, '[$1]');
  code = code.replace(/\.size\s*\(\s*\)/g, '.length');
  code = code.replace(/\.isEmpty\s*\(\s*\)/g, '.length === 0');
  code = code.replace(/\.remove\s*\((\d+)\)/g, '.splice($1, 1)');

  // Scanner → replaced individually per call
  code = code.replace(/\bnew\s+Scanner\s*\([^)]*\)\s*;?/g, '/* Scanner ready */');
  code = code.replace(/\bScanner\s+(\w+)\s*=\s*\/\*[^*]*\*\//g, 'let $1 = {}');
  // .nextInt(), .nextDouble(), .next(), .nextLine()
  code = code.replace(/(\w+)\.nextInt\s*\(\s*\)/g, "(await __readInput__('int'))");
  code = code.replace(/(\w+)\.nextDouble\s*\(\s*\)/g, "(await __readInput__('double'))");
  code = code.replace(/(\w+)\.nextFloat\s*\(\s*\)/g, "(await __readInput__('double'))");
  code = code.replace(/(\w+)\.nextLong\s*\(\s*\)/g, "(await __readInput__('int'))");
  code = code.replace(/(\w+)\.next\s*\(\s*\)/g, "(await __readInput__('word'))");
  code = code.replace(/(\w+)\.nextLine\s*\(\s*\)/g, "(await __readInput__('line'))");

  // Type cast idioms: (int) x → Math.trunc(x)
  code = code.replace(/\(int\)\s*([a-zA-Z0-9_.()]+)/g, 'Math.trunc($1)');
  code = code.replace(/\(double\)\s*([a-zA-Z0-9_.()]+)/g, 'Number($1)');
  code = code.replace(/\(float\)\s*([a-zA-Z0-9_.()]+)/g, 'Number($1)');
  code = code.replace(/\(String\)\s*([a-zA-Z0-9_.()]+)/g, 'String($1)');

  // String concatenation with + is same in JS — no change needed
  // final keyword: strip
  code = code.replace(/\bfinal\s+/g, '');
  // static (in method body context) — strip
  // Access modifiers stripped later at class-level

  return code;
};

/**
 * Parse a Java class body and produce JavaScript class code.
 * Handles: fields, constructors, methods (instance + static), access modifiers.
 */
const transpileClassBody = (className, body, superClass) => {
  // Access modifier and type patterns to strip from member declarations
  const modifiers = /\b(public|private|protected|static|final|synchronized|abstract|native|transient|volatile)\b\s*/g;

  // Split body into members by scanning for { } balanced blocks
  const members = [];
  let i = 0;
  while (i < body.length) {
    // Skip whitespace and semicolons
    if (/[\s;]/.test(body[i])) { i++; continue; }

    // Find the next { or ;
    let memberStart = i;
    let j = i;
    let depth = 0;
    let inStr = false;
    let strCh = '';
    while (j < body.length) {
      const ch = body[j];
      if (inStr) {
        if (ch === strCh && body[j-1] !== '\\') inStr = false;
        j++; continue;
      }
      if (ch === '"' || ch === "'") { inStr = true; strCh = ch; j++; continue; }
      if (ch === '{') { depth++; }
      if (ch === '}') {
        depth--;
        if (depth === 0) { j++; break; }
      }
      if (ch === ';' && depth === 0) { j++; break; }
      j++;
    }
    members.push(body.substring(memberStart, j).trim());
    i = j;
  }

  const fields = [];
  const constructors = [];
  const methods = [];
  const staticMethods = [];
  const staticFields = [];

  for (const member of members) {
    if (!member || member === '}') continue;

    const isStatic = /\bstatic\b/.test(member);
    const stripped = member.replace(modifiers, '');

    // Detect constructor: ClassName(...)  {  }
    const ctorMatch = stripped.match(new RegExp(`^${className}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*)\\}\\s*$`));
    if (ctorMatch) {
      constructors.push({ params: ctorMatch[1].trim(), body: ctorMatch[2] });
      continue;
    }

    // Detect method: returnType name(...) { body }
    const methodMatch = stripped.match(/^[\w<>\[\],\s]+?\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/);
    if (methodMatch) {
      const mName = methodMatch[1];
      const mParams = methodMatch[2];
      const mBody = methodMatch[3];
      if (isStatic) {
        staticMethods.push({ name: mName, params: mParams, body: mBody });
      } else {
        methods.push({ name: mName, params: mParams, body: mBody });
      }
      continue;
    }

    // Detect field: type name = value; or type name;
    const fieldMatch = stripped.match(/^[\w<>\[\],\s]+?\s+(\w+)\s*(?:=\s*([\s\S]+?))?\s*;?\s*$/);
    if (fieldMatch && fieldMatch[1] !== className) {
      if (isStatic) {
        staticFields.push({ name: fieldMatch[1], value: fieldMatch[2] || 'undefined' });
      } else {
        fields.push({ name: fieldMatch[1], value: fieldMatch[2] || 'undefined' });
      }
    }
  }

  // Build constructor body: initialize fields then user constructor body
  const defaultFieldInits = fields.map(f => `this.${f.name} = ${f.value === 'undefined' ? 'undefined' : f.value};`).join('\n    ');

  const ctorBodies = constructors.map(ctor => {
    const paramList = ctor.params
      ? ctor.params.split(',').map(p => {
          const parts = p.trim().split(/\s+/);
          return parts[parts.length - 1]; // last word is the param name
        }).join(', ')
      : '';
    const translatedBody = transpileMethodBody(ctor.body, className);
    return `  constructor(${paramList}) {\n    ${superClass ? 'super();' : ''}\n    ${defaultFieldInits}\n    ${translatedBody}\n  }`;
  });

  // If no explicit constructor, still init fields
  const ctorSection = ctorBodies.length > 0
    ? ctorBodies[0]  // JS only supports one constructor
    : `  constructor() {\n    ${superClass ? 'super();' : ''}\n    ${defaultFieldInits}\n  }`;

  // Instance methods
  const methodSection = methods.map(m => {
    const paramList = m.params
      ? m.params.split(',').map(p => { const parts = p.trim().split(/\s+/); return parts[parts.length - 1]; }).join(', ')
      : '';
    const translatedBody = transpileMethodBody(m.body, className);
    return `  ${m.name}(${paramList}) {\n    ${translatedBody}\n  }`;
  }).join('\n\n');

  // Static methods
  const staticMethodSection = staticMethods.map(m => {
    const paramList = m.params
      ? m.params.split(',').map(p => { const parts = p.trim().split(/\s+/); return parts[parts.length - 1]; }).join(', ')
      : '';
    const translatedBody = transpileMethodBody(m.body, className);
    return `  static ${m.name}(${paramList}) {\n    ${translatedBody}\n  }`;
  }).join('\n\n');

  // Static fields
  const staticFieldSection = staticFields.map(f => `${className}.${f.name} = ${f.value === 'undefined' ? 'undefined' : f.value};`).join('\n');

  const extendsClause = superClass ? ` extends ${superClass}` : '';

  return `class ${className}${extendsClause} {\n${ctorSection}\n\n${methodSection}\n\n${staticMethodSection}\n}\n${staticFieldSection}`;
};

/**
 * Translate a Java method body to JavaScript.
 */
const transpileMethodBody = (body, currentClass) => {
  let code = body;

  // Strip access modifiers used inside method scope (shouldn't be there, but be safe)
  code = code.replace(/\b(public|private|protected)\b\s*/g, '');

  // Translate types and built-ins
  code = translateTypes(code);
  code = translateBuiltins(code);

  // this.field access — already correct in JS
  // super() calls — already correct in JS

  // String comparison: .equals() → === (simplified for sandbox)
  code = code.replace(/(\w+)\.equals\s*\(([^)]+)\)/g, '($1 === $2)');
  code = code.replace(/(\w+)\.equalsIgnoreCase\s*\(([^)]+)\)/g, '($1.toLowerCase() === $2.toLowerCase())');

  // .toString() — mostly a no-op in JS
  code = code.replace(/\.toString\s*\(\s*\)/g, '');

  // null → null (same)
  // true/false → true/false (same)

  // Wrap in async IIFE marker so await works (added by caller)
  return code.trim();
};

/**
 * Main Java → JS transpiler entry point.
 * Finds all class definitions, transpiles them to JS classes,
 * then finds and runs main().
 */
const transpileJava = (rawSrc) => {
  let src = stripComments(rawSrc);
  src = stripImports(src);

  // Find all top-level class declarations
  const classRegex = /\b(?:public\s+|private\s+|protected\s+|abstract\s+|final\s+)*class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+[\w,\s]+)?\s*\{/g;
  const classes = [];
  let match;

  while ((match = classRegex.exec(src)) !== null) {
    const className = match[1];
    const superClass = match[2] || null;
    const bodyStart = match.index + match[0].length - 1; // index of opening {
    const bodyEnd = findMatchingBrace(src, bodyStart);
    if (bodyEnd === -1) continue;
    const body = src.substring(bodyStart + 1, bodyEnd);
    classes.push({ className, superClass, body, bodyStart, bodyEnd });
  }

  if (classes.length === 0) {
    return { error: 'No class definition found. Please define at least one public class.' };
  }

  // Transpile each class
  const jsClasses = classes.map(c => transpileClassBody(c.className, c.body, c.superClass)).join('\n\n');

  // Find the class that has a main method
  const mainClass = classes.find(c => /public\s+static\s+void\s+main\b/.test(c.body) || /static\s+public\s+void\s+main\b/.test(c.body));
  if (!mainClass) {
    return { error: 'main method not found. Ensure one class contains:\n  public static void main(String[] args)' };
  }

  // Extract main body
  const mainMatch = mainClass.body.match(/(?:public\s+static|static\s+public)\s+void\s+main\s*\([^)]*\)\s*\{/);
  if (!mainMatch) return { error: 'Could not parse main method signature.' };

  const mainBodyStart = mainClass.body.indexOf(mainMatch[0]) + mainMatch[0].length - 1;
  const mainBodyEnd = findMatchingBrace(mainClass.body, mainBodyStart);
  const mainBody = mainClass.body.substring(mainBodyStart + 1, mainBodyEnd);
  const translatedMain = transpileMethodBody(mainBody, mainClass.className);

  return {
    js: `${jsClasses}\n\n// Entry point\nawait (async function main() {\n${translatedMain}\n})();`
  };
};

const runCode = async () => {
  isRunning.value = true;
  output.value = 'Compiling Java...\n';
  currentInput.value = '';
  isWaitingForInput.value = false;
  resolveInputPromise = null;

  setTimeout(async () => {
    // Collect all file sources
    let rawSrc = code.value;
    if (props.allFiles && props.allFiles.length > 0) {
      rawSrc = props.allFiles.map(f => f.code).join('\n\n');
    }

    // Transpile Java → JS
    const result = transpileJava(rawSrc);
    if (result.error) {
      output.value = 'Compilation Error: ' + result.error;
      isRunning.value = false;
      return;
    }

    const jsCode = result.js;
    output.value = ''; // clear "Compiling..." message

    // Runtime helpers
    const __print__ = (val) => {
      output.value += (val !== undefined && val !== null ? String(val) : 'null') + '\n';
    };
    const __printInline__ = (val) => {
      output.value += (val !== undefined && val !== null ? String(val) : 'null');
    };
    const __readInput__ = (type) => {
      isWaitingForInput.value = true;
      setTimeout(() => focusConsole(), 50);
      return new Promise((resolve) => {
        resolveInputPromise = (val) => {
          isWaitingForInput.value = false;
          output.value += val + '\n';
          if (type === 'int') resolve(parseInt(val) || 0);
          else if (type === 'double') resolve(parseFloat(val) || 0.0);
          else resolve(val);
        };
      });
    };

    try {
      const execFn = new Function('__print__', '__printInline__', '__readInput__', `
        return (async () => {
          ${jsCode}
        })();
      `);
      await execFn(__print__, __printInline__, __readInput__);
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
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: none;
  padding: 0;
  margin: 0;
  cursor: text;
  z-index: 10;
  font-size: 16px;
}

@keyframes blink {
  from, to { color: transparent }
  50% { color: #5af78e }
}
</style>

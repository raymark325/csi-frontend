<template>
  <div class="glass-card q-pa-lg">
    <div class="row justify-between items-center q-mb-md">
      <div class="row items-center q-gutter-sm">
        <span class="badge badge-blue">Java Sandbox</span>
        <span class="text-caption text-red text-weight-bold">⚠️ Copy-Paste Disabled</span>

        <!-- Problems badge (display only) -->
        <span
          class="badge flex items-center q-px-sm"
          :style="{
            background: problems.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            color: problems.length > 0 ? '#ef4444' : '#22c55e',
            border: `1px solid ${problems.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
          }"
        >
          <q-icon :name="problems.length > 0 ? 'cancel' : 'check_circle'" size="14px" class="q-mr-xs" />
          {{ problems.length }} {{ problems.length === 1 ? 'Problem' : 'Problems' }}
        </span>
      </div>

      <div class="row q-gutter-xs">
        <q-btn color="primary" icon="play_arrow" label="Run Code" rounded unelevated :loading="isRunning" @click="runCode(false)"/>
      </div>
    </div>

    <!-- Code Editor Box -->
    <div class="editor-container">
      <!-- Line number gutter -->
      <div class="line-numbers-gutter" ref="gutterRef">
        <div
          v-for="n in lineCount"
          :key="n"
          class="line-number"
          :class="{ 'line-number--error': errorLines.has(n) }"
        >{{ n }}</div>
      </div>
      <!-- Code textarea -->
      <textarea
        ref="textareaRef"
        v-model="code"
        class="code-textarea"
        placeholder="public class Main { ... }"
        spellcheck="false"
        wrap="off"
        :readonly="disabled"
        @keydown.tab.prevent="insertTab"
        @copy.prevent="preventAction"
        @paste.prevent="preventAction"
        @cut.prevent="preventAction"
        @scroll="syncGutterScroll"
      ></textarea>
    </div>

    <!-- Output Console (unified: program output + inline errors) -->
    <div class="output-console q-mt-md">
      <!-- Console header -->
      <div class="row justify-between items-center q-mb-sm border-bottom-dark q-pb-xs">
        <div class="row items-center q-gutter-xs">
          <q-icon name="terminal" size="16px" style="color: #94a3b8;" />
          <span class="text-weight-bold" style="color: #94a3b8; font-size: 12px;">CONSOLE</span>
        </div>
        <div>
          <span v-if="isRunning && !isWaitingForInput" class="text-caption text-grey-4">Compiling &amp; Running...</span>
          <span v-else-if="isWaitingForInput" class="text-caption text-amber text-weight-bold" style="font-size: 11px;">⚠️ Program waiting for input — click below to type</span>
        </div>
      </div>

      <!-- Program output -->
      <div class="console-content" @click="focusConsole" style="position: relative;">
        <pre class="console-text"><span>{{ output || 'Console ready. Click Run Code to execute.' }}</span><span class="user-typed-input">{{ currentInput }}</span><span v-if="isWaitingForInput" class="console-cursor">█</span></pre>
        <input
          ref="consoleInputRef"
          v-model="currentInput"
          type="text"
          class="console-inline-input"
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
  activeFileName: {
    type: String,
    default: 'Main.java'
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
const textareaRef = ref(null);

// activeBottomTab removed — unified console
const problems = ref([]);
const gutterRef = ref(null);

// Computed line count from code
const lineCount = computed(() => (code.value.match(/\n/g) || []).length + 1);

// Set of line numbers that have errors — used to highlight gutter numbers
const errorLines = computed(() => {
  const set = new Set();
  problems.value.forEach(p => { if (p.line) set.add(p.line); });
  return set;
});

const syncGutterScroll = () => {
  if (gutterRef.value && textareaRef.value) {
    gutterRef.value.scrollTop = textareaRef.value.scrollTop;
  }
};

const focusConsole = () => {
  if (consoleInputRef.value) {
    consoleInputRef.value.focus();
  }
};

// Global input resolver callback
let resolveInputPromise = null;
let lastSubmitTimestamp = 0;

const submitMobileInput = (e) => {
  if (props.disabled || !isRunning.value || !isWaitingForInput.value) return;

  // Guard against Enter key auto-repeat: ignore if submitted less than 300ms ago
  const now = Date.now();
  if (now - lastSubmitTimestamp < 300) return;
  lastSubmitTimestamp = now;

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
    if (e.target) e.target.selectionStart = e.target.selectionEnd = start + 4;
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

/**
 * Real-time & On-demand Java Syntax & Error Analyzer (Eclipse / NetBeans Style)
 */
const analyzeJavaCode = (sourceCode, fileName = 'Main.java', filesList = []) => {
  const resultProblems = [];
  if (!sourceCode) return resultProblems;

  const lines = sourceCode.split('\n');

  // 1. Bracket & Parentheses Matching
  const stack = [];

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const lineNum = lIdx + 1;
    const lineText = lines[lIdx];

    // Check for string literal unclosed on same line (unless escaped)
    let inString = false;
    let isEscaped = false;
    for (let cIdx = 0; cIdx < lineText.length; cIdx++) {
      const ch = lineText[cIdx];
      if (ch === '\\' && !isEscaped) {
        isEscaped = true;
        continue;
      }
      if (ch === '"' && !isEscaped) {
        inString = !inString;
      }
      isEscaped = false;
    }

    if (inString) {
      resultProblems.push({
        type: 'error',
        file: fileName,
        line: lineNum,
        message: 'Unterminated string literal (missing closing quote ")',
        snippet: lineText.trim(),
        quickFix: 'Add closing double quote "'
      });
    }

    // Bracket stack matching (ignoring comments and strings)
    let cleanLine = lineText
      .replace(/\/\/.*/, '')
      .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""')
      .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''");
    
    for (let cIdx = 0; cIdx < cleanLine.length; cIdx++) {
      const ch = cleanLine[cIdx];
      if (ch === '{' || ch === '(' || ch === '[') {
        stack.push({ ch, line: lineNum, col: cIdx + 1 });
      } else if (ch === '}' || ch === ')' || ch === ']') {
        if (stack.length === 0) {
          resultProblems.push({
            type: 'error',
            file: fileName,
            line: lineNum,
            message: `Unmatched closing bracket '${ch}'`,
            snippet: lineText.trim(),
            quickFix: `Remove extra '${ch}' or add matching opening bracket`
          });
        } else {
          const top = stack.pop();
          const expectedPair = { '}': '{', ')': '(', ']': '[' }[ch];
          if (top.ch !== expectedPair) {
            resultProblems.push({
              type: 'error',
              file: fileName,
              line: lineNum,
              message: `Mismatching bracket '${ch}'. Expected closing bracket for '${top.ch}' from line ${top.line}`,
              snippet: lineText.trim(),
              quickFix: `Replace '${ch}' with matching closing bracket`
            });
          }
        }
      }
    }

    // 2. Missing Semicolon Check
    const trimmed = cleanLine.trim();
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
      const isControlOrHeader = (
        trimmed.endsWith('{') || 
        trimmed.endsWith('}') || 
        trimmed.endsWith(':') || 
        trimmed.endsWith(',') ||
        trimmed.startsWith('if') ||
        trimmed.startsWith('else') ||
        trimmed.startsWith('for') ||
        trimmed.startsWith('while') ||
        trimmed.startsWith('switch') ||
        trimmed.startsWith('case') ||
        trimmed.startsWith('default') ||
        trimmed.startsWith('@') ||
        trimmed.startsWith('public class') ||
        trimmed.startsWith('class ') ||
        trimmed.startsWith('interface ') ||
        trimmed.startsWith('abstract class') ||
        trimmed.includes('static void main') ||
        trimmed.match(/^(public|private|protected|static|\s)*[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*$/)
      );

      if (!isControlOrHeader && !trimmed.endsWith(';')) {
        resultProblems.push({
          type: 'error',
          file: fileName,
          line: lineNum,
          message: "Syntax Error: Missing semicolon ';' at end of statement",
          snippet: lineText.trim(),
          quickFix: "Add ';' at the end of line"
        });
      }
    }
  }

  // Report any remaining unclosed brackets in stack
  while (stack.length > 0) {
    const unclosed = stack.pop();
    const nameMap = { '{': 'brace {', '(': 'parenthesis (', '[': 'bracket [' };
    resultProblems.push({
      type: 'error',
      file: fileName,
      line: unclosed.line,
      message: `Syntax Error: Unclosed ${nameMap[unclosed.ch]} introduced on line ${unclosed.line}`,
      snippet: (lines[unclosed.line - 1] || '').trim(),
      quickFix: `Add closing '${unclosed.ch === '{' ? '}' : unclosed.ch === '(' ? ')' : ']'}'`
    });
  }

  // 3. Public Class vs Filename Matching
  const publicClassMatch = sourceCode.match(/\bpublic\s+class\s+(\w+)/);
  if (publicClassMatch) {
    const pubClassName = publicClassMatch[1];
    const expectedFileName = `${pubClassName}.java`;
    if (fileName && fileName !== expectedFileName) {
      let pubClassLine = 1;
      for (let l = 0; l < lines.length; l++) {
        if (lines[l].includes(`public class ${pubClassName}`)) {
          pubClassLine = l + 1;
          break;
        }
      }
      resultProblems.push({
        type: 'error',
        file: fileName,
        line: pubClassLine,
        message: `Class Error: Public class '${pubClassName}' must be defined in a file named '${expectedFileName}'`,
        snippet: (lines[pubClassLine - 1] || '').trim(),
        quickFix: `Rename class to '${fileName.replace('.java', '')}' or rename file`
      });
    }
  }

  // 4. Entry point check for Main class
  if (fileName === 'Main.java' || sourceCode.includes('class Main')) {
    if (!sourceCode.includes('public static void main')) {
      resultProblems.push({
        type: 'warning',
        file: fileName,
        line: 1,
        message: "Missing Entry Point: Class 'Main' does not contain 'public static void main(String[] args)'",
        snippet: 'class Main { ... }',
        quickFix: 'Generate public static void main(String[] args) method'
      });
    }
  }

  // 5. Statements directly inside class body check
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    if (line.includes('System.out.') && !isInsideMethod(sourceCode, l)) {
      resultProblems.push({
        type: 'error',
        file: fileName,
        line: l + 1,
        message: "Structure Error: Statement like 'System.out.print' must be inside a method or constructor body",
        snippet: line.trim(),
        quickFix: "Move statement inside public static void main() or a method"
      });
    }
  }

  // 6. Multi-file Duplicate Class check
  if (filesList && filesList.length > 1) {
    const currentClasses = [];
    const classMatches = sourceCode.matchAll(/\b(?:public\s+)?class\s+(\w+)/g);
    for (const m of classMatches) {
      currentClasses.push(m[1]);
    }
    for (const otherFile of filesList) {
      if (otherFile.name !== fileName && otherFile.code) {
        for (const cls of currentClasses) {
          if (otherFile.code.includes(`class ${cls}`)) {
            resultProblems.push({
              type: 'error',
              file: fileName,
              line: 1,
              message: `Duplicate Class Error: Class '${cls}' is already defined in file '${otherFile.name}'`,
              snippet: `class ${cls}`,
              quickFix: `Rename class '${cls}' to avoid conflict across files`
            });
          }
        }
      }
    }
  }

  return resultProblems;
};

// Helper: Check if line index is inside a method body
const isInsideMethod = (codeVal, lineIdx) => {
  const lines = codeVal.split('\n');
  let openBraceCount = 0;
  for (let i = 0; i <= lineIdx; i++) {
    const l = lines[i].replace(/\/\/.*/, '');
    for (const ch of l) {
      if (ch === '{') openBraceCount++;
      if (ch === '}') openBraceCount--;
    }
  }
  return openBraceCount >= 2;
};

const runAnalyzer = () => {
  problems.value = analyzeJavaCode(code.value, props.activeFileName, props.allFiles);
};

const jumpToLine = (lineNum) => {
  if (!textareaRef.value) return;
  const text = code.value;
  const lines = text.split('\n');
  let pos = 0;
  for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
    pos += lines[i].length + 1;
  }
  textareaRef.value.focus();
  textareaRef.value.setSelectionRange(pos, pos + (lines[lineNum - 1] || '').length);
};

// Re-run analyzer on code changes
watch([code, () => props.activeFileName, () => props.allFiles], () => {
  runAnalyzer();
}, { immediate: true });

// ── Java → JavaScript Transpiler ─────────────────────────────────────────────
const stripComments = (src) => {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  src = src.replace(/\/\/[^\n]*/g, '');
  return src;
};

const stripImports = (src) => {
  src = src.replace(/\r\n/g, '\n');
  src = src.replace(/^\s*import\s+[\w\.]+(\.\*)?\s*;?/gm, '');
  src = src.replace(/^\s*package\s+[\w\.]+\s*;?/gm, '');
  return src;
};

const translateTypes = (codeVal) => {
  const primitiveTypes = [
    'int', 'double', 'float', 'long', 'short', 'byte', 'boolean', 'char',
    'String', 'var', 'Object'
  ];
  const typePattern = primitiveTypes.join('|');

  codeVal = codeVal.replace(
    new RegExp(`(?<=[;{}\\n\\(,]\\s*)(?:(?:${typePattern})(?:\\s*\\[\\])*|(?:[A-Z][\\w]*(?:<[^>]*>)?(?:\\s*\\[\\])*))(?=\\s+[a-z_$][\\w$]*)`, 'g'),
    'let'
  );

  codeVal = codeVal.replace(
    new RegExp(`\\bfor\\s*\\(\\s*(?:${typePattern})(?:\\s*\\[\\])*`, 'g'),
    'for (let'
  );

  codeVal = codeVal.replace(
    new RegExp(`\\bfor\\s*\\(\\s*(?:${typePattern}|[A-Z][\\w]*)(?:\\s*\\[\\])?\\s+([a-z_$][\\w$]*)\\s*:\\s*`, 'g'),
    'for (let $1 of '
  );

  return codeVal;
};

const translateBuiltins = (codeVal) => {
  codeVal = codeVal.replace(/System\.out\.println\s*\(/g, '__print__(');
  codeVal = codeVal.replace(/System\.out\.print\s*\(/g, '__printInline__(');
  codeVal = codeVal.replace(/System\.out\.printf\s*\(/g, '__printInline__(');
  codeVal = codeVal.replace(/System\.err\.println\s*\(/g, '__print__(');

  codeVal = codeVal.replace(/\.length\s*\(\s*\)/g, '.length');
  codeVal = codeVal.replace(/\bString\.valueOf\s*\(/g, 'String(');

  codeVal = codeVal.replace(/\bInteger\.parseInt\s*\(/g, 'parseInt(');
  codeVal = codeVal.replace(/\bDouble\.parseDouble\s*\(/g, 'parseFloat(');
  codeVal = codeVal.replace(/\bFloat\.parseFloat\s*\(/g, 'parseFloat(');
  codeVal = codeVal.replace(/\bLong\.parseLong\s*\(/g, 'parseInt(');
  codeVal = codeVal.replace(/\bInteger\.toString\s*\(/g, 'String(');
  codeVal = codeVal.replace(/\bInteger\.MAX_VALUE\b/g, 'Number.MAX_SAFE_INTEGER');
  codeVal = codeVal.replace(/\bInteger\.MIN_VALUE\b/g, 'Number.MIN_SAFE_INTEGER');

  codeVal = codeVal.replace(/\bArrays\.toString\s*\(([^)]+)\)/g, '($1).join(", ")');
  codeVal = codeVal.replace(/\bArrays\.sort\s*\(([^)]+)\)/g, '$1.sort((a,b)=>a-b)');

  codeVal = codeVal.replace(/new\s+ArrayList\s*<[^>]*>\s*\(\s*\)/g, '[]');
  codeVal = codeVal.replace(/new\s+LinkedList\s*<[^>]*>\s*\(\s*\)/g, '[]');
  codeVal = codeVal.replace(/\.add\s*\(/g, '.push(');
  codeVal = codeVal.replace(/\.get\s*\(\s*(\w+)\s*\)/g, '[$1]');
  codeVal = codeVal.replace(/\.size\s*\(\s*\)/g, '.length');
  codeVal = codeVal.replace(/\.isEmpty\s*\(\s*\)/g, '.length === 0');
  codeVal = codeVal.replace(/\.remove\s*\((\d+)\)/g, '.splice($1, 1)');

  // Scanner initialization (handles "Scanner scan = new Scanner(System.in)" or "let scan = new Scanner(System.in)" or "scan = new Scanner(System.in)")
  codeVal = codeVal.replace(/(?:Scanner|let)?\s*([a-zA-Z_$][\w$]*)\s*=\s*new\s+Scanner\s*\([^)]*\)\s*;?/g, 'let $1 = {};');
  codeVal = codeVal.replace(/\bnew\s+Scanner\s*\([^)]*\)\s*;?/g, '{}');
  codeVal = codeVal.replace(/(\w+)\.nextInt\s*\(\s*\)/g, "(await __readInput__('int'))");
  codeVal = codeVal.replace(/(\w+)\.nextDouble\s*\(\s*\)/g, "(await __readInput__('double'))");
  codeVal = codeVal.replace(/(\w+)\.nextFloat\s*\(\s*\)/g, "(await __readInput__('double'))");
  codeVal = codeVal.replace(/(\w+)\.nextLong\s*\(\s*\)/g, "(await __readInput__('int'))");
  codeVal = codeVal.replace(/(\w+)\.next\s*\(\s*\)/g, "(await __readInput__('word'))");
  codeVal = codeVal.replace(/(\w+)\.nextLine\s*\(\s*\)/g, "(await __readInput__('line'))");
  codeVal = codeVal.replace(/(\w+)\.close\s*\(\s*\)\s*;?/g, '/* Scanner closed */');
  codeVal = codeVal.replace(/(\w+)\.hasNext\w*\s*\(\s*\)/g, 'true');

  codeVal = codeVal.replace(/\(int\)\s*([a-zA-Z0-9_.()]+)/g, 'Math.trunc($1)');
  codeVal = codeVal.replace(/\(double\)\s*([a-zA-Z0-9_.()]+)/g, 'Number($1)');
  codeVal = codeVal.replace(/\(float\)\s*([a-zA-Z0-9_.()]+)/g, 'Number($1)');
  codeVal = codeVal.replace(/\(String\)\s*([a-zA-Z0-9_.()]+)/g, 'String($1)');
  // Strip class/object casts like (Dog) myDog — JS doesn't need them
  codeVal = codeVal.replace(/\([A-Z][\w]*\)\s*/g, '');

  codeVal = codeVal.replace(/\bfinal\s+/g, '');
  return codeVal;
};

// ── Quick first-pass parser: collect field/method names from a class body ──────
const parseClassMemberInfo = (body, className) => {
  const modifiers = /\b(public|private|protected|static|final|synchronized|abstract|native|transient|volatile)\b\s*/g;
  const instanceFields = [];
  const instanceMethods = [];
  const asyncInstanceMethods = new Set();

  // Reuse the same member-splitting logic
  const members = [];
  let i = 0;
  while (i < body.length) {
    if (/[\s;]/.test(body[i])) { i++; continue; }
    let j = i, depth = 0, inStr = false, strCh = '';
    while (j < body.length) {
      const ch = body[j];
      if (inStr) { if (ch === strCh && body[j-1] !== '\\') inStr = false; j++; continue; }
      if (ch === '"' || ch === "'") { inStr = true; strCh = ch; j++; continue; }
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) { j++; break; } }
      if (ch === ';' && depth === 0) { j++; break; }
      j++;
    }
    members.push(body.substring(i, j).trim());
    i = j;
  }

  for (const member of members) {
    if (!member || member === '}') continue;
    const isStatic = /\bstatic\b/.test(member);
    const stripped = member.replace(new RegExp(modifiers.source, 'g'), '');

    // Constructor?
    const ctorMatch = stripped.match(new RegExp(`^${className}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*)\\}\\s*$`));
    if (ctorMatch) continue;

    // Method?
    const methodMatch = stripped.match(/^[\w<>\[\],\s]+?\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/);
    if (methodMatch) {
      const mName = methodMatch[1];
      const mBody = methodMatch[2];
      if (!isStatic) {
        instanceMethods.push(mName);
        const translated = translateBuiltins(mBody);
        if (translated.includes('await __readInput__')) asyncInstanceMethods.add(mName);
      }
      continue;
    }

    // Field? (skip abstract method declarations that end with ';' and have '()' — no body)
    const isAbstractDecl = /^[\w<>\[\],\s]+?\s+\w+\s*\([^)]*\)\s*;\s*$/.test(stripped);
    const fieldMatch = stripped.match(/^[\w<>\[\],\s]+?\s+(\w+)\s*(?:=\s*[\s\S]+?)?\s*;?\s*$/);
    if (fieldMatch && fieldMatch[1] !== className && !isStatic && !isAbstractDecl) {
      instanceFields.push(fieldMatch[1]);
    }
  }

  return { instanceFields, instanceMethods, asyncInstanceMethods };
};

const transpileClassBody = (className, body, superClass, inheritedFields = [], inheritedMethods = [], globalAsyncMethods = new Set()) => {
  const modifiers = /\b(public|private|protected|static|final|synchronized|abstract|native|transient|volatile)\b\s*/g;

  const members = [];
  let i = 0;
  while (i < body.length) {
    if (/[\s;]/.test(body[i])) { i++; continue; }

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

    const ctorMatch = stripped.match(new RegExp(`^${className}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*)\\}\\s*$`));
    if (ctorMatch) {
      constructors.push({ params: ctorMatch[1].trim(), body: ctorMatch[2] });
      continue;
    }

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

    const fieldMatch = stripped.match(/^[\w<>\[\],\s]+?\s+(\w+)\s*(?:=\s*([\s\S]+?))?\s*;?\s*$/);
    // Skip abstract method declarations like "void makeSound();" — no body, ends with ';'
    const isAbstractMethod = /^[\w<>\[\],\s]+?\s+\w+\s*\([^)]*\)\s*;\s*$/.test(stripped);
    if (fieldMatch && fieldMatch[1] !== className && !isAbstractMethod) {
      if (isStatic) {
        staticFields.push({ name: fieldMatch[1], value: fieldMatch[2] || 'undefined' });
      } else {
        fields.push({ name: fieldMatch[1], value: fieldMatch[2] || 'undefined' });
      }
    }
  }

  // Combine inherited + own instance fields and methods
  const allInstanceFields = [...inheritedFields, ...fields.map(f => f.name)];
  const allInstanceMethods = [...inheritedMethods, ...methods.map(m => m.name)];

  // Build the set of async methods for this class (inherited + own that use await)
  const localAsyncMethods = new Set(globalAsyncMethods);
  for (const m of [...methods, ...staticMethods]) {
    const translated = translateBuiltins(m.body);
    if (translated.includes('await __readInput__')) localAsyncMethods.add(m.name);
  }

  const defaultFieldInits = fields.map(f => `this.${f.name} = ${f.value === 'undefined' ? 'undefined' : f.value};`).join('\n    ');

  const ctorBodies = constructors.map(ctor => {
    const paramList = ctor.params
      ? ctor.params.split(',').map(p => {
          const parts = p.trim().split(/\s+/);
          return parts[parts.length - 1];
        }).join(', ')
      : '';
    const translatedBody = transpileMethodBody(ctor.body, className, { instanceFields: allInstanceFields, instanceMethods: allInstanceMethods, asyncMethods: localAsyncMethods, isStatic: false });
    
    let userSuperCall = '';
    let restOfBody = translatedBody;
    const superMatch = translatedBody.match(/^\s*super\s*\([^)]*\)\s*;/);
    if (superMatch) {
      userSuperCall = superMatch[0];
      restOfBody = translatedBody.substring(superMatch[0].length);
    } else if (superClass) {
      userSuperCall = 'super();';
    }

    return `  constructor(${paramList}) {\n    ${userSuperCall}\n    ${defaultFieldInits}\n    ${restOfBody}\n  }`;
  });

  const ctorSection = ctorBodies.length > 0
    ? ctorBodies[0]
    : `  constructor() {\n    ${superClass ? 'super();' : ''}\n    ${defaultFieldInits}\n  }`;

  const methodSection = methods.map(m => {
    const paramList = m.params
      ? m.params.split(',').map(p => { const parts = p.trim().split(/\s+/); return parts[parts.length - 1]; }).join(', ')
      : '';
    const translatedBody = transpileMethodBody(m.body, className, { instanceFields: allInstanceFields, instanceMethods: allInstanceMethods, asyncMethods: localAsyncMethods, isStatic: false });
    const isAsync = translatedBody.includes('await ');
    return `  ${isAsync ? 'async ' : ''}${m.name}(${paramList}) {\n    ${translatedBody}\n  }`;
  }).join('\n\n');

  const staticMethodSection = staticMethods.map(m => {
    const paramList = m.params
      ? m.params.split(',').map(p => { const parts = p.trim().split(/\s+/); return parts[parts.length - 1]; }).join(', ')
      : '';
    const translatedBody = transpileMethodBody(m.body, className, { instanceFields: [], instanceMethods: [], asyncMethods: localAsyncMethods, isStatic: true });
    const isAsync = translatedBody.includes('await ');
    return `  static ${isAsync ? 'async ' : ''}${m.name}(${paramList}) {\n    ${translatedBody}\n  }`;
  }).join('\n\n');

  const staticFieldSection = staticFields.map(f => `${className}.${f.name} = ${f.value === 'undefined' ? 'undefined' : f.value};`).join('\n');
  const extendsClause = superClass ? ` extends ${superClass}` : '';

  return `class ${className}${extendsClause} {\n${ctorSection}\n\n${methodSection}\n\n${staticMethodSection}\n}\n${staticFieldSection}`;
};

const transpileMethodBody = (body, currentClass, opts = {}) => {
  const { instanceFields = [], instanceMethods = [], asyncMethods = new Set(), isStatic = false } = opts;

  let codeVal = body;
  codeVal = codeVal.replace(/\b(public|private|protected)\b\s*/g, '');
  codeVal = translateBuiltins(codeVal);
  codeVal = translateTypes(codeVal);

  // ── String-literal protection ─────────────────────────────────────────────
  // Replace all string literals with safe placeholders so regex substitutions
  // (this-prefix, await injection) never touch the text inside "..." or '...'
  const strLiterals = [];
  codeVal = codeVal.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (match) => {
    strLiterals.push(match);
    return `__STRLIT_${strLiterals.length - 1}__`;
  });

  // For instance methods: add this. prefix to bare field/method references
  if (!isStatic && (instanceFields.length > 0 || instanceMethods.length > 0)) {
    // Collect locally declared variable names to avoid wrongly prefixing them
    const localVars = new Set();
    const lvRe = /\b(?:let|var|const)\s+(\w+)/g;
    let lm;
    while ((lm = lvRe.exec(codeVal)) !== null) localVars.add(lm[1]);
    // Also collect for-of loop variables
    const foRe = /\bfor\s*\(\s*(?:let|var|const)?\s*(\w+)\s+of\b/g;
    while ((lm = foRe.exec(codeVal)) !== null) localVars.add(lm[1]);

    // Add this. to bare instance field reads/writes (not locally declared, not followed by '(')
    for (const field of instanceFields) {
      if (localVars.has(field)) continue;
      const re = new RegExp(`(?<![\\w.])\\b${field}\\b(?![\\w(])`, 'g');
      codeVal = codeVal.replace(re, `this.${field}`);
    }

    // Add this. (and await if async) to bare instance method calls
    for (const method of instanceMethods) {
      if (localVars.has(method)) continue;
      const isAsync = asyncMethods.has(method);
      const prefix = isAsync ? 'await this.' : 'this.';
      const re = new RegExp(`(?<![\\w.])\\b${method}\\s*\\(`, 'g');
      codeVal = codeVal.replace(re, `${prefix}${method}(`);
    }
  }

  // Add await to object.method() calls for known async methods (both static and instance contexts)
  for (const method of asyncMethods) {
    // Match obj.method( not already preceded by 'await'
    const re = new RegExp(`(?<!await\\s)\\b(\\w+)\\.(${method})\\s*\\(`, 'g');
    codeVal = codeVal.replace(re, 'await $1.$2(');
  }

  // ── Restore string literals ───────────────────────────────────────────────
  strLiterals.forEach((str, idx) => {
    codeVal = codeVal.replace(`__STRLIT_${idx}__`, str);
  });

  codeVal = codeVal.replace(/(\w+)\.equals\s*\(([^)]+)\)/g, '($1 === $2)');
  codeVal = codeVal.replace(/(\w+)\.equalsIgnoreCase\s*\(([^)]+)\)/g, '($1.toLowerCase() === $2.toLowerCase())');
  codeVal = codeVal.replace(/\.toString\s*\(\s*\)/g, '');
  return codeVal.trim();
};

const transpileJava = (rawSrc) => {
  let src = stripComments(rawSrc);
  src = stripImports(src);
  src = src.replace(/@\w+\b/g, '');

  const classRegex = /\b(?:public\s+|private\s+|protected\s+|abstract\s+|final\s+)*class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+[\w,\s]+)?\s*\{/g;
  const classes = [];
  let match;
  while ((match = classRegex.exec(src)) !== null) {
    const className = match[1];
    const superClass = match[2] || null;
    const braceIdx = match.index + match[0].length - 1;
    const endIdx = findMatchingBrace(src, braceIdx);
    if (endIdx !== -1) {
      const body = src.substring(braceIdx + 1, endIdx);
      classes.push({ name: className, superClass, body });
    }
  }

  if (classes.length === 0) {
    return { error: 'No class definition found. Ensure your code defines a class (e.g. public class Main { ... }).' };
  }

  // First pass: collect all class member metadata
  const classInfoMap = {};
  for (const cls of classes) {
    classInfoMap[cls.name] = parseClassMemberInfo(cls.body, cls.name);
  }

  // Aggregate all async instance methods from all classes
  const globalAsyncMethods = new Set();
  for (const info of Object.values(classInfoMap)) {
    for (const m of info.asyncInstanceMethods) globalAsyncMethods.add(m);
  }

  // Recursively compute inherited fields and methods
  const getInherited = (cls, visited = new Set()) => {
    if (!cls.superClass || visited.has(cls.name) || !classInfoMap[cls.superClass]) {
      return { fields: [], methods: [] };
    }
    visited.add(cls.name);
    const parentCls = classes.find(c => c.name === cls.superClass);
    const grandInherited = parentCls ? getInherited(parentCls, visited) : { fields: [], methods: [] };
    const parentInfo = classInfoMap[cls.superClass];
    return {
      fields: [...grandInherited.fields, ...parentInfo.instanceFields],
      methods: [...grandInherited.methods, ...parentInfo.instanceMethods],
    };
  };

  // Second pass: transpile each class with full context
  const jsClasses = classes.map(cls => {
    const inherited = getInherited(cls);
    return transpileClassBody(cls.name, cls.body, cls.superClass, inherited.fields, inherited.methods, globalAsyncMethods);
  });

  let entryClass = classes.find(c => c.name === 'Main') || classes[0];
  // Direct await in the AsyncFunction body — no inner IIFE needed
  const mainRunner = `\nif (typeof ${entryClass.name} !== 'undefined' && typeof ${entryClass.name}.main === 'function') {\n  await ${entryClass.name}.main([]);\n} else {\n  __print__("Notice: No static main() method found in ${entryClass.name}. Class loaded.");\n}`;

  return { js: jsClasses.join('\n\n') + '\n' + mainRunner };
};

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

const runCode = (isAuto = false) => {
  if (isRunning.value) return;

  runAnalyzer();
  const criticalErrors = problems.value.filter(p => p.type === 'error');
  if (criticalErrors.length > 0) {
    let errorMsg = `⚠️ Found ${criticalErrors.length} compilation error(s):\n\n`;
    criticalErrors.forEach(err => {
      errorMsg += `[Line ${err.line}] ${err.message}\n`;
    });
    output.value = errorMsg;
    return;
  }

  isRunning.value = true;
  output.value = 'Compiling and executing Java project...\n';

  setTimeout(async () => {
    let rawSrc = code.value;
    if (props.allFiles && props.allFiles.length > 0) {
      rawSrc = props.allFiles.map(f => f.code).join('\n\n');
    }

    const result = transpileJava(rawSrc);
    if (result.error) {
      output.value = 'Compilation Error: ' + result.error;
      isRunning.value = false;
      return;
    }

    const jsCode = result.js;
    output.value = '';

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
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const execFn = new AsyncFunction('__print__', '__printInline__', '__readInput__', jsCode);
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
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

/* Line number gutter */
.line-numbers-gutter {
  background: #171717;
  color: #4a5568;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 16px 10px 16px 8px;
  text-align: right;
  user-select: none;
  min-width: 44px;
  overflow-y: hidden; /* scroll synced via JS */
  overflow-x: hidden;
  border-right: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}

.line-number {
  height: 21px; /* matches line-height: 1.5 × font-size: 14px */
}

.line-number--error {
  color: #ef4444;
  font-weight: 700;
}

.code-textarea {
  flex: 1;
  min-width: 0;
  height: 320px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  padding: 16px 16px 16px 8px;
  resize: vertical;
  outline: none;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
  overflow-y: auto;
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

.user-typed-input {
  color: #ffaa00;
  font-weight: bold;
}

.console-cursor {
  animation: blink 1s step-end infinite;
  color: #5af78e;
  font-weight: bold;
}



@keyframes blink {
  from, to { color: transparent }
  50% { color: #5af78e }
}

/* Transparent inline console input — overlays the full console area */
.console-inline-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: transparent;
  caret-color: transparent;
  font-size: 14px;
  cursor: text;
  z-index: 10;
  padding: 0;
  margin: 0;
  resize: none;
}

.console-cursor {
  animation: blink 0.8s step-end infinite;
  color: #5af78e;
  font-weight: bold;
}
</style>

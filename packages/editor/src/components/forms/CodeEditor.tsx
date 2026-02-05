import React, { useRef, useCallback } from 'react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { cn } from '../../utils/cn';

// Monaco Editor 类型
type MonacoEditor = editor.IStandaloneCodeEditor;

export interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  height?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  
  // 编辑器选项
  options?: editor.IStandaloneEditorConstructionOptions;
  
  // 提示词相关
  variables?: string[];
  showVariableHighlight?: boolean;
  
  // 回调
  onMount?: (editor: MonacoEditor) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  
  // 验证
  validate?: (value: string) => { valid: boolean; error?: string };
}

// 默认编辑器配置
const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  folding: true,
  wordWrap: 'on',
  automaticLayout: true,
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
  lineHeight: 22,
  padding: { top: 12, bottom: 12 },
  scrollbar: {
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false,
    vertical: 'auto',
    horizontal: 'auto',
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  renderLineHighlight: 'line',
  matchBrackets: 'always',
  autoIndent: 'full',
  formatOnPaste: true,
  formatOnType: true,
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  wordBasedSuggestions: 'allDocuments',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  onChange,
  language = 'plaintext',
  theme = 'vs',
  height = 200,
  minHeight,
  maxHeight,
  readOnly = false,
  placeholder,
  className,
  options = {},
  variables = [],
  showVariableHighlight = false,
  onMount,
  onBlur,
  onFocus,
  validate,
}) => {
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

  // 编辑器挂载
  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 配置 TypeScript/JavaScript 编译选项
    if (language === 'typescript' || language === 'javascript') {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        noLib: true,
        allowNonTsExtensions: true,
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      });
    }

    // 注册变量高亮 (如果启用)
    if (showVariableHighlight && variables.length > 0) {
      // 添加装饰器类型
      monaco.editor.defineTheme('horos-variable-theme', {
        base: theme === 'vs-dark' ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [
          { token: 'variable.horos', foreground: '0066CC', fontStyle: 'bold' },
        ],
        colors: {},
      });
    }

    // 监听失焦事件
    editor.onDidBlurEditorWidget(() => {
      onBlur?.();
    });

    // 监听聚焦事件
    editor.onDidFocusEditorWidget(() => {
      onFocus?.();
    });

    onMount?.(editor);
  }, [language, onMount, onBlur, onFocus, showVariableHighlight, variables, theme]);

  // 编辑器加载前的配置
  const handleBeforeMount: BeforeMount = useCallback((_monaco) => {
    // 可以在这里进行全局 Monaco 配置
  }, []);

  // 值变化处理
  const handleChange = useCallback((newValue: string | undefined) => {
    const val = newValue ?? '';
    
    // 验证
    if (validate) {
      const result = validate(val);
      if (!result.valid && editorRef.current) {
        // 可以在这里添加错误标记
      }
    }
    
    onChange?.(val);
  }, [onChange, validate]);

  // 合并选项
  const mergedOptions: editor.IStandaloneEditorConstructionOptions = {
    ...defaultOptions,
    ...options,
    readOnly,
    language,
  };

  return (
    <div
      className={cn(
        'relative border border-gray-200 rounded-lg overflow-hidden',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
        className
      )}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: minHeight ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : undefined,
        maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
      }}
    >
      <Editor
        value={value}
        language={language}
        theme={theme}
        options={mergedOptions}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
        onChange={handleChange}
        loading={
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading editor...
          </div>
        }
      />
      
      {/* Placeholder */}
      {!value && placeholder && (
        <div className="absolute top-3 left-4 text-gray-400 pointer-events-none select-none">
          {placeholder}
        </div>
      )}
    </div>
  );
};

// 提示词编辑器 (专门用于编辑提示词)
export interface PromptEditorProps extends Omit<CodeEditorProps, 'language'> {
  promptVariables?: string[];
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  promptVariables = [],
  ...props
}) => {
  const defaultVariables = [
    'input',
    'context',
    'history',
    'user',
    'agent',
    ...promptVariables,
  ];

  return (
    <CodeEditor
      {...props}
      language="plaintext"
      showVariableHighlight={true}
      variables={defaultVariables}
      placeholder={props.placeholder ?? 'Enter prompt template... Use ${variable} for variables'}
    />
  );
};

// JSON 编辑器
export interface JsonEditorProps extends Omit<CodeEditorProps, 'language' | 'validate'> {
  schema?: object;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  schema,
  ...props
}) => {
  const validateJson = (value: string): { valid: boolean; error?: string } => {
    try {
      if (value.trim()) {
        JSON.parse(value);
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  };

  return (
    <CodeEditor
      {...props}
      language="json"
      validate={validateJson}
      placeholder={props.placeholder ?? '{\n  \"key\": \"value\"\n}'}
    />
  );
};

// 代码编辑器 (通用代码)
export interface ScriptEditorProps extends Omit<CodeEditorProps, 'language'> {
  language: 'typescript' | 'javascript' | 'python' | 'json' | 'yaml' | 'plaintext';
}

export const ScriptEditor: React.FC<ScriptEditorProps> = (props) => {
  return <CodeEditor {...props} />;
};

export default CodeEditor;

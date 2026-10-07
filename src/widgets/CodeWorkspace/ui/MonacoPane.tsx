'use client';

import Editor, { type BeforeMount } from '@monaco-editor/react';
import { useUnit } from 'effector-react';
import { $isGenerating } from '@/entities/AiSession';
import { $activeFile, type FileNode } from '@/entities/FileSystem';
import { $editorValue, editorTextChanged } from '@/features/EditCodeInline';
import { EditorSkeleton } from './EditorSkeleton';

const defineSandboxTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('sandbox-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0e141b',
      'editor.foreground': '#d5dee8',
      'editorLineNumber.foreground': '#546478',
      'editorLineNumber.activeForeground': '#3ee0b0',
      'editorCursor.foreground': '#3ee0b0',
      'editor.selectionBackground': '#1d3b46',
      'editor.lineHighlightBackground': '#121a23',
    },
  });
};

export function MonacoPane() {
  const [file, value, generating, onChange] = useUnit([
    $activeFile,
    $editorValue,
    $isGenerating,
    editorTextChanged,
  ]);

  if (!file) {
    return <EditorSkeleton />;
  }

  return (
    <Editor
      height="100%"
      language={monacoLanguage(file)}
      theme="sandbox-dark"
      path={file.id}
      value={value}
      beforeMount={defineSandboxTheme}
      loading={<EditorSkeleton />}
      onChange={(nextValue) => {
        if (generating || nextValue === undefined || nextValue === value) {
          return;
        }

        onChange({ path: file.id, content: nextValue });
      }}
      options={{
        readOnly: generating,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: 'var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace',
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        renderLineHighlight: 'line',
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      }}
    />
  );
}

function monacoLanguage(file: FileNode): string {
  if (file.id.endsWith('.tsx') || file.language === 'typescript') {
    return 'typescript';
  }

  return file.language;
}

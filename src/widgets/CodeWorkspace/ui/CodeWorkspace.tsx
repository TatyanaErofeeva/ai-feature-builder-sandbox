'use client';

import dynamic from 'next/dynamic';
import type { BeforeMount } from '@monaco-editor/react';
import {
  Component,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useUnit } from 'effector-react';
import { $isGenerating } from '@/entities/AiSession';
import {
  $activeFile,
  updateFileContent,
  type FileNode,
} from '@/entities/FileSystem';
import { compileComponent, type CompileResult } from '../lib/compileComponent';
import { EditorSkeleton } from './EditorSkeleton';

const Editor = dynamic(() => import('@monaco-editor/react').then((module) => module.default), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const REACT_EDITOR_TYPES = `
declare namespace React {
  type ReactNode = any;
  type FC<P = Record<string, unknown>> = (props: P) => ReactNode;
  type FormEvent<T = any> = any;
  function createElement(...args: any[]): any;
}

declare global {
  namespace JSX {
    interface Element {}
    interface IntrinsicElements {
      [elemName: string]: { [prop: string]: any };
    }
  }
}

declare module "react" {
  export type ReactNode = any;
  export type FormEvent<T = any> = any;
  export function useState<S = any>(initial: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: readonly unknown[]): T;
  export function useRef<T>(initial: T): { current: T };
  export const Fragment: any;
  const React: any;
  export default React;
}

declare module "react/jsx-runtime" {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module "react/jsx-dev-runtime" {
  export const Fragment: any;
  export function jsxDEV(type: any, props: any, key: any, isStatic: boolean, source: any, self: any): any;
}
`;

const prepareEditor: BeforeMount = (monaco) => {
  const compilerOptions = {
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    allowJs: true,
    esModuleInterop: true,
    allowUmdGlobalAccess: true,
    noEmit: true,
    lib: ['esnext', 'dom'],
  };

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    ...compilerOptions,
    allowJs: true,
    checkJs: false,
  });
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    REACT_EDITOR_TYPES,
    'file:///node_modules/@types/react/index.d.ts',
  );
};

const SAVE_DELAY_MS = 300;
const PREVIEW_INTERVAL_MS = 120;
const ERROR_HOLD_MS = 1500;

export function CodeWorkspace() {
  const [activeFile, generating, saveContent] = useUnit([
    $activeFile,
    $isGenerating,
    updateFileContent,
  ]);
  const [draft, setDraft] = useState(activeFile?.content ?? '');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ path: string; content: string } | null>(null);
  const saveContentRef = useRef(saveContent);
  const activeId = activeFile?.id ?? null;
  const activeContent = activeFile?.content ?? '';

  saveContentRef.current = saveContent;

  const flushSave = () => {
    if (saveTimer.current !== null) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const pending = pendingSave.current;
    pendingSave.current = null;

    if (pending) {
      saveContentRef.current(pending);
    }
  };

  useEffect(() => {
    flushSave();
  }, [activeId]);

  useEffect(() => {
    if (pendingSave.current) {
      return;
    }

    setDraft(activeContent);
  }, [activeId, activeContent]);

  useEffect(() => {
    if (!generating) {
      return;
    }

    if (saveTimer.current !== null) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    pendingSave.current = null;
  }, [generating]);

  useEffect(() => () => flushSave(), []);

  const scheduleSave = (path: string, content: string) => {
    pendingSave.current = { path, content };

    if (saveTimer.current !== null) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      const pending = pendingSave.current;
      pendingSave.current = null;

      if (pending) {
        saveContentRef.current(pending);
      }
    }, SAVE_DELAY_MS);
  };

  return (
    <div className="grid h-full min-h-0 w-full min-w-0 grid-cols-2">
      <div className="h-full min-h-0 overflow-hidden border-r border-zinc-800">
        {activeFile ? (
          <Editor
            height="100%"
            theme="vs-dark"
            language={editorLanguage(activeFile)}
            path={`file:///sandbox/${activeFile.id}`}
            beforeMount={prepareEditor}
            value={generating ? activeContent : draft}
            loading={<EditorSkeleton />}
            onChange={(value) => {
              if (generating || value === undefined) {
                return;
              }

              setDraft(value);
              scheduleSave(activeFile.id, value);
            }}
            options={{
              readOnly: generating,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace',
              scrollBeyondLastLine: false,
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-950 px-8 text-center">
            <p className="max-w-sm font-mono text-sm leading-relaxed text-zinc-400">
              Select a file to inspect or generate a new feature using AI prompt
            </p>
          </div>
        )}
      </div>
      <div className="h-full min-h-0 overflow-y-auto bg-zinc-900/20 p-4">
        <PreviewPane file={activeFile} />
      </div>
    </div>
  );
}

function editorLanguage(file: FileNode): string {
  if (file.id.endsWith('.jsx')) {
    return 'javascript';
  }

  if (file.id.endsWith('.tsx')) {
    return 'typescript';
  }

  return file.language;
}

function PreviewPane({ file }: { file: FileNode | null }) {
  const generating = useUnit($isGenerating);
  const source = file?.id.endsWith('.tsx') ? file.content : null;
  const compiled = usePreviewCompile(source);
  const view = useStablePreview(file, compiled, generating);

  return (
    <CompilationBoundary resetKey={`${file?.id ?? 'none'}:${view.resetKey}`}>
      <ComponentRunner file={file} view={view} />
    </CompilationBoundary>
  );
}

interface ReadyCompile {
  ok: true;
  revision: number;
  content: string;
  Component: ComponentType;
}

interface FailedCompile {
  ok: false;
  revision: number;
  content: string;
  message: string;
}

type PreviewCompile = ReadyCompile | FailedCompile;

type PreviewView =
  | { phase: 'idle'; resetKey: string }
  | { phase: 'compiling'; resetKey: string }
  | { phase: 'ready'; resetKey: string; Component: ComponentType }
  | { phase: 'error'; resetKey: string; message: string };

function useStablePreview(
  file: FileNode | null,
  compiled: PreviewCompile | null,
  generating: boolean,
): PreviewView {
  const fileId = file?.id ?? null;
  const isTsx = fileId?.endsWith('.tsx') ?? false;
  const matchesFile = Boolean(compiled && file && compiled.content === file.content);
  const failureKey =
    matchesFile && compiled && !compiled.ok ? `${compiled.revision}:${compiled.content}` : null;
  const [visibleFailureKey, setVisibleFailureKey] = useState<string | null>(null);
  const lastGoodRef = useRef<{ fileId: string; snapshot: ReadyCompile } | null>(null);

  if (lastGoodRef.current && lastGoodRef.current.fileId !== fileId) {
    lastGoodRef.current = null;
  }

  if (matchesFile && compiled?.ok && fileId) {
    lastGoodRef.current = { fileId, snapshot: compiled };
  }

  useEffect(() => {
    if (failureKey === null || !generating) {
      setVisibleFailureKey(failureKey);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleFailureKey(failureKey);
    }, ERROR_HOLD_MS);

    return () => window.clearTimeout(timer);
  }, [failureKey, generating]);

  if (!isTsx) {
    return { phase: 'idle', resetKey: 'idle' };
  }

  if (!matchesFile || !compiled) {
    return { phase: 'compiling', resetKey: 'compiling' };
  }

  if (compiled.ok) {
    return {
      phase: 'ready',
      resetKey: `ok:${compiled.revision}`,
      Component: compiled.Component,
    };
  }

  const settled = !generating || visibleFailureKey === failureKey;

  if (settled) {
    return {
      phase: 'error',
      resetKey: `err:${compiled.revision}`,
      message: compiled.message,
    };
  }

  const lastGood = lastGoodRef.current;

  if (lastGood?.fileId === fileId) {
    return {
      phase: 'ready',
      resetKey: `held:${lastGood.snapshot.revision}`,
      Component: lastGood.snapshot.Component,
    };
  }

  return { phase: 'compiling', resetKey: 'compiling' };
}

function usePreviewCompile(source: string | null): PreviewCompile | null {
  const [snapshot, setSnapshot] = useState<PreviewCompile | null>(null);
  const serial = useRef(0);
  const revision = useRef(0);
  const lastStartedAt = useRef(0);

  useEffect(() => {
    if (source === null) {
      return undefined;
    }

    const id = ++serial.current;

    const publish = (result: CompileResult, compiledSource: string) => {
      if (id !== serial.current) {
        return;
      }

      revision.current += 1;

      if (result.ok) {
        setSnapshot({
          ok: true,
          revision: revision.current,
          content: compiledSource,
          Component: result.Component,
        });
        return;
      }

      setSnapshot({
        ok: false,
        revision: revision.current,
        content: compiledSource,
        message: result.message,
      });
    };

    const run = () => {
      lastStartedAt.current = Date.now();
      void compileSource(source).then((result) => publish(result, source));
    };

    const elapsed = Date.now() - lastStartedAt.current;

    if (elapsed >= PREVIEW_INTERVAL_MS) {
      run();
      return undefined;
    }

    const timer = setTimeout(run, PREVIEW_INTERVAL_MS - elapsed);
    return () => clearTimeout(timer);
  }, [source]);

  return snapshot;
}

async function compileSource(source: string): Promise<CompileResult> {
  const [babelModule, reactModule] = await Promise.all([
    import('@babel/standalone'),
    import('react'),
  ]);

  return compileComponent(babelModule, source, reactModule);
}

function ComponentRunner({ file, view }: { file: FileNode | null; view: PreviewView }) {
  if (!file || !file.id.endsWith('.tsx') || view.phase === 'idle') {
    return (
      <p className="font-mono text-sm leading-relaxed text-zinc-400">
        Preview available for React components (*.tsx) only
      </p>
    );
  }

  if (view.phase === 'compiling') {
    return <p className="font-mono text-sm text-zinc-500">Compiling preview...</p>;
  }

  if (view.phase === 'error') {
    return <CompilationMessage message={view.message} />;
  }

  const View = view.Component as ComponentType<{ children?: ReactNode }>;

  if (file.name === 'layout.tsx') {
    return (
      <View>
        <div className="rounded border border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-center font-mono text-xs text-zinc-400">
          [ Layout Content Shell Area ]
          <br />
          <span className="text-[10px] text-zinc-500">
            Children components inject seamlessly here in production
          </span>
        </div>
      </View>
    );
  }

  return <View />;
}

interface CompilationBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface CompilationBoundaryState {
  error: Error | null;
}

class CompilationBoundary extends Component<CompilationBoundaryProps, CompilationBoundaryState> {
  state: CompilationBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CompilationBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: CompilationBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return <CompilationMessage message={this.state.error.message} />;
    }

    return this.props.children;
  }
}

function CompilationMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 font-mono text-sm text-red-400">
      <p className="font-bold mb-1">Compilation Error:</p>
      <pre className="whitespace-pre-wrap">{message}</pre>
    </div>
  );
}

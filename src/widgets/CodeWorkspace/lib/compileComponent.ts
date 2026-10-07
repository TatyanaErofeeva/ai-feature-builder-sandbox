import type { ComponentType } from 'react';
import type * as BabelTypes from '@babel/standalone';
import type * as ReactTypes from 'react';

export interface CompileSuccess {
  ok: true;
  Component: ComponentType;
}

export interface CompileFailure {
  ok: false;
  message: string;
}

export type CompileResult = CompileSuccess | CompileFailure;

interface BabelTransformOptions {
  filename: string;
  sourceType: 'module';
  comments: boolean;
  presets: Array<string | [string, { runtime?: 'classic'; isTSX?: boolean; allExtensions?: boolean }]>;
}

interface BabelTransform {
  transform: (code: string, options: BabelTransformOptions) => { code?: string | null };
}

export function compileComponent(
  babelModule: typeof BabelTypes,
  source: string,
  react: typeof ReactTypes,
): CompileResult {
  let transformed = '';

  try {
    const babel = resolveBabel(babelModule);
    const result = babel.transform(source, {
      filename: 'Preview.tsx',
      sourceType: 'module',
      comments: false,
      presets: [
        ['react', { runtime: 'classic' }],
        ['typescript', { isTSX: true, allExtensions: true }],
      ],
    });
    transformed = result.code ?? '';
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }

  if (transformed.trim().length === 0) {
    return { ok: false, message: 'Компилятор вернул пустой модуль' };
  }

  const rewritten = ensureReactInScope(rewriteModuleSyntax(transformed));

  if (!rewritten.includes('__defaultExport')) {
    return { ok: false, message: 'В файле нет default-экспорта компонента' };
  }

  try {
    const factory = new Function(
      'require',
      `"use strict";\n${rewritten}\nreturn __defaultExport;`,
    ) as (requireFn: (id: string) => unknown) => unknown;

    const exported = factory((id: string) => {
      if (id === 'react') {
        return react;
      }

      throw new Error(`Импорт "${id}" недоступен в изолированном превью`);
    });

    if (typeof exported !== 'function') {
      return { ok: false, message: 'Default-экспорт не является React-компонентом' };
    }

    return { ok: true, Component: exported as ComponentType };
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }
}

function resolveBabel(babelModule: typeof BabelTypes): BabelTransform {
  if (isBabelTransform(babelModule)) {
    return babelModule;
  }

  const fallback = (babelModule as { default?: unknown }).default;
  if (isBabelTransform(fallback)) {
    return fallback;
  }

  throw new Error('Babel standalone не экспортирует transform');
}

function isBabelTransform(value: unknown): value is BabelTransform {
  if (typeof value !== 'object' || value === null || !('transform' in value)) {
    return false;
  }

  return typeof value.transform === 'function';
}

function ensureReactInScope(code: string): string {
  if (code.includes('require("react")') || code.includes("require('react')")) {
    return code;
  }

  return `const React = require("react");\n${code}`;
}

function rewriteModuleSyntax(code: string): string {
  return code
    .replace(/import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(
      /import\s+\*\s+as\s+React\s+from\s+['"]react['"];?/g,
      'const React = require("react");',
    )
    .replace(
      /import\s+React\s*,\s*\{([\s\S]*?)\}\s*from\s+['"]react['"];?/g,
      'const React = require("react"); const {$1} = React;',
    )
    .replace(/import\s+React\s+from\s+['"]react['"];?/g, 'const React = require("react");')
    .replace(
      /import\s+\{([\s\S]*?)\}\s*from\s+['"]react['"];?/g,
      'const React = require("react"); const {$1} = React;',
    )
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+default\s+/g, 'const __defaultExport = ')
    .replace(/export\s+async\s+function\s+/g, 'async function ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+class\s+/g, 'class ')
    .replace(/export\s+(const|let|var)\s+/g, '$1 ')
    .replace(/export\s+\{[\s\S]*?\};?/g, '');
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Неизвестная ошибка компиляции';
}

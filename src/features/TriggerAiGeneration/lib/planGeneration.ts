import { folderExists, type FileSystemState } from '@/entities/FileSystem';
import { buildSliceFiles, type FeatureKind, type PlannedFile } from './templates';

export interface GenerationPlan {
  featureName: string;
  kind: FeatureKind;
  files: PlannedFile[];
}

const KIND_RULES: ReadonlyArray<{ kind: FeatureKind; pattern: RegExp; fallback: string }> = [
  { kind: 'auth', pattern: /auth|login|sign[\s-]?in|вход|авториз|логин|парол/i, fallback: 'AuthForm' },
  { kind: 'todo', pattern: /todo|task|задач|список/i, fallback: 'TodoList' },
  { kind: 'metrics', pattern: /dashboard|metric|метрик|аналитик|наблюда/i, fallback: 'MetricsBoard' },
];

export function planGeneration(prompt: string, tree: FileSystemState): GenerationPlan {
  const kind = detectKind(prompt);
  const requestedName = detectName(prompt, kind);
  const featureName = uniqueFeatureName(tree, requestedName);

  return {
    featureName,
    kind,
    files: buildSliceFiles(featureName, kind, prompt),
  };
}

function detectKind(prompt: string): FeatureKind {
  const match = KIND_RULES.find((rule) => rule.pattern.test(prompt));
  return match?.kind ?? 'generic';
}

function detectName(prompt: string, kind: FeatureKind): string {
  const explicit = prompt.match(/\b([A-Z][A-Za-z0-9]{2,})\b/);
  if (explicit?.[1]) {
    return toIdentifier(explicit[1]);
  }

  const quoted = prompt.match(/["'«]([A-Za-z][A-Za-z0-9]+)["'»]/);
  if (quoted?.[1]) {
    return toIdentifier(quoted[1]);
  }

  const fallback = KIND_RULES.find((rule) => rule.kind === kind)?.fallback ?? 'FeaturePanel';
  return fallback;
}

function uniqueFeatureName(tree: FileSystemState, baseName: string): string {
  if (!folderExists(tree, `src/features/${baseName}`)) {
    return baseName;
  }

  let index = 2;
  while (folderExists(tree, `src/features/${baseName}${index}`)) {
    index += 1;
  }

  return `${baseName}${index}`;
}

function toIdentifier(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]/g, '');
  const pascal = cleaned.length > 0 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'FeaturePanel';

  if (!/^[A-Za-z]/.test(pascal)) {
    return `Feature${pascal}`;
  }

  return pascal;
}

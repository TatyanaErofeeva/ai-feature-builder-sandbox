export const AI_MODELS = [
  {
    id: 'sandbox-coder-fast',
    label: 'Sandbox Coder Fast',
    charsPerSecond: 240,
  },
  {
    id: 'sandbox-coder-balanced',
    label: 'Sandbox Coder',
    charsPerSecond: 96,
  },
  {
    id: 'sandbox-coder-precise',
    label: 'Sandbox Coder Precise',
    charsPerSecond: 36,
  },
] as const;

export type ModelId = (typeof AI_MODELS)[number]['id'];

export const defaultModelId: ModelId = 'sandbox-coder-fast';

export function isModelId(value: string): value is ModelId {
  return AI_MODELS.some((model) => model.id === value);
}

export function modelById(id: ModelId): (typeof AI_MODELS)[number] {
  const model = AI_MODELS.find((item) => item.id === id);
  return model ?? AI_MODELS[1];
}

export interface PromptExample {
  id: string;
  label: string;
  prompt: string;
}

export const PROMPT_EXAMPLES: readonly PromptExample[] = [
  {
    id: 'auth',
    label: 'Sign-in form',
    prompt: 'Build an AuthForm feature: a sign-in form with email and password',
  },
  {
    id: 'todo',
    label: 'Task list',
    prompt: 'Build a TodoList feature: a task list with add and toggle',
  },
  {
    id: 'metrics',
    label: 'Metrics board',
    prompt: 'Build a MetricsBoard feature: an engineering metrics panel',
  },
];

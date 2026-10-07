export interface PromptExample {
  id: string;
  label: string;
  prompt: string;
}

export const PROMPT_EXAMPLES: readonly PromptExample[] = [
  {
    id: 'auth',
    label: 'Форма входа',
    prompt: 'Собери фичу AuthForm: форма входа с email и паролем',
  },
  {
    id: 'todo',
    label: 'Список задач',
    prompt: 'Собери фичу TodoList: список задач с добавлением и отметкой',
  },
  {
    id: 'metrics',
    label: 'Панель метрик',
    prompt: 'Собери фичу MetricsBoard: панель инженерных метрик',
  },
];

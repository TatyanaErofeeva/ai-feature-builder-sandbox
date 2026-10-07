# AI-Driven Feature Builder Sandbox 🚀

[English Version](#english-version) | [Русская версия](#русская-версия)

---

## English Version

A high-performance developer workspace designed to simulate real-time AI code generation, live compilation, and sandboxed component rendering inside the browser. Built under strict production-grade architectural guidelines.

### 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 15+ (App Router, React 19 concurrency features)
- **State Management:** Effector (Atomic state paradigm, zero domain logic inside React components)
- **Architecture:** Feature-Sliced Design (FSD) Specification
- **Editor Core:** `@monaco-editor/react` (Lazy loaded, zero SSR layout shifts)
- **Runtime Compiler:** `@babel/standalone` (In-browser JSX/TSX compilation)
- **Styling:** TailwindCSS (Developer-centric dark mode dashboard layout)

---

### 🎯 Core Architectural Solutions

#### 1. Flat Filesystem State Machine (`src/entities/FileSystem`)
Instead of nesting recursive array objects which slow down under heavy mutations, the virtual filesystem is modeled as an immutable hash-map: `Record<string, FileNode | FolderNode>`. Finding, reading, or appending folders/files happens at **O(1)** complexity.

#### 2. Asynchronous Token Streaming with Race Condition Protection
Simulating a live character-by-character token injection loop introduces heavy potential for race conditions. The project utilizes localized incrementing session tokens inside pure Effector effects. If a duplicate process runs, previous streams immediately terminate, preventing memory leaks and string collisions.

#### 3. Self-Healing `CompilationBoundary`
Runtime dynamic compilation can constantly fail when an LLM writes incomplete tags. To stop the root application from crashing into a white screen, a custom React Error Boundary monitors the preview frame. It intercepts compilation errors and uses a `resetKey` bounded to compilation revisions—the live preview auto-recovers gracefully the exact millisecond the code buffer becomes valid again.

#### 4. Debounced Local Buffer Flusher
To maximize performance, manual inputs inside Monaco Editor use a debounced buffer state. Switching active files triggers an instant synchronous flush (`flushSave`), preserving written data without spamming the state stores on every keypress.

---

### 📁 FSD Folder Structure Diagram

```text
src/
├── app/                  # Next.js App Router setup, global providers, styles
├── pages/                # SandboxPage layout composition
├── widgets/              # Large composite components (TopBar, Sidebar, CodeWorkspace)
├── features/             # Business capabilities (TriggerAiGeneration, EditCodeInline)
├── entities/             # Domain business models (FileSystem, AiSession)
└── shared/               # Reusable primitives (API bridges, generic layouts, hooks)
```

### 🚀 Getting Started

First, install dependencies and run the local development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Русская версия

Высокопроизводительная инженерная песочница (sandbox) для разработчиков, созданная для имитации посимвольного ИИ-стриминга кода, динамической компиляции и изолированного рендеринга React-компонентов прямо в браузере. Проект реализован в соответствии со строгими корпоративными стандартами архитектуры.

### 🛠️ Технологический стек и архитектура

- **Фреймворк:** Next.js 15+ (App Router, конкурентные фичи React 19)
- **Управление состоянием:** Effector (Атомарная декларативная парадигма, бизнес-логика на 100% изолирована от React-компонентов)
- **Архитектурная методология:** Feature-Sliced Design (FSD)
- **Редактор кода:** `@monaco-editor/react` (Ленивая загрузка, полное отсутствие сдвигов макета/hydration shifts на сервере)
- **Рантайм-компилятор:** `@babel/standalone` (Компиляция JSX/TSX на лету на стороне клиента)
- **Стилизация:** TailwindCSS (Строгая темная инженерная тема дашборда)

---

### 🎯 Ключевые архитектурные решения

#### 1. Плоское дерево файловой системы (`src/entities/FileSystem`)
Вместо использования тяжелых рекурсивных массивов и объектов, которые вызывают лаги при частых обновлениях, виртуальная файловая система спроектирована как иммутабельный хэш-мап: `Record<string, FileNode | FolderNode>`. Операции поиска, чтения и добавления папок/файлов происходят со скоростью **O(1)**.

#### 2. Посимвольный стриминг с защитой от Race Conditions (Состояний гонки)
Имитация живой посимвольной печати ИИ с интервалом в 30мс создает высокий риск состояний гонки (string collisions) при частых кликах. В проекте реализован механизм инкрементируемых сессионных токенов внутри асинхронных эффектов Effector. При запуске новой генерации все предыдущие циклы мгновенно и безопасно прерываются, что полностью исключает утечки памяти.

#### 3. Самовосстанавливающийся `CompilationBoundary`
Динамическая рантайм-компиляция неизбежно выдает синтаксические ошибки в процессе печати кода нейросетью. Чтобы это не приводило к падению всего приложения в «белый экран», холст предпросмотра обернут в кастомный React Error Boundary. Он перехватывает ошибки компиляции и завязан на динамический параметр `resetKey` — как только ИИ дописывает тег или пользователь исправляет ошибку в Monaco, превью автоматически оживает без перезагрузки страницы.

#### 4. Буферизация и отложенное сохранение (Debounced Buffer)
Вводить код в Monaco и отправлять изменения в глобальный стор Effector на каждое нажатие клавиши неэффективно. Применяется локальный draft-стейт с дебаунсом в 300мс. При этом принудительное переключение файлов пользователем мгновенно вызывает синхронный сброс буфера (`flushSave`), предотвращая потерю написанного кода.

---

### 📁 Схема папок по методологии FSD

```text
src/
├── app/                  # Инициализация Next.js, глобальные провайдеры контекста, стили
├── pages/                # Композиция главного экрана SandboxPage
├── widgets/              # Крупные блоки интерфейса (TopBar, Sidebar, CodeWorkspace)
├── features/             # Бизнес-фичи с триггерами (TriggerAiGeneration, EditCodeInline)
├── entities/             # Бизнес-сущности и модели данных (FileSystem, AiSession)
└── shared/               # Переиспользуемые утилиты (API-моки, базовые ui-компоненты, hooks)
```

### 🚀 Быстрый старт

Установите зависимости и запустите локальный сервер для разработки:

```bash
npm install
npm run dev
```

Откройте в браузере [http://localhost:3000](http://localhost:3000) для работы с песочницей.

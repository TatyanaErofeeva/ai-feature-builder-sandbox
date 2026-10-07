import type { FileNode } from '@/entities/FileSystem';

export type FeatureKind = 'auth' | 'todo' | 'metrics' | 'generic';

export interface PlannedFile {
  path: string;
  language: FileNode['language'];
  content: string;
}

const shellStyle = `const shell = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minHeight: "100%",
  padding: 20,
  boxSizing: "border-box",
  color: "#d5dee8",
  fontFamily: "Manrope, Segoe UI, sans-serif",
};`;

export function buildSliceFiles(
  featureName: string,
  kind: FeatureKind,
  prompt: string,
): PlannedFile[] {
  const base = `src/features/${featureName}`;

  return [
    {
      path: `${base}/index.ts`,
      language: 'typescript',
      content: `export { default as ${featureName} } from "./ui/${featureName}";\n`,
    },
    {
      path: `${base}/model/store.ts`,
      language: 'typescript',
      content: modelSource(featureName, kind, prompt),
    },
    {
      path: `${base}/ui/${featureName}.tsx`,
      language: 'typescript',
      content: viewSource(featureName, kind, prompt),
    },
  ];
}

function modelSource(featureName: string, kind: FeatureKind, prompt: string): string {
  if (kind === 'auth') {
    return `import { createEvent, createStore } from "effector";

export interface ${featureName}Values {
  email: string;
  password: string;
}

export const submitted = createEvent<${featureName}Values>();

export const $lastSubmission = createStore<${featureName}Values | null>(null).on(
  submitted,
  (_, values) => values,
);
`;
  }

  if (kind === 'todo') {
    return `import { createEvent, createStore } from "effector";

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
}

export const taskAdded = createEvent<string>();
export const taskToggled = createEvent<string>();

export const $tasks = createStore<TodoItem[]>([])
  .on(taskAdded, (tasks, title) => [
    ...tasks,
    { id: String(tasks.length + 1), title, done: false },
  ])
  .on(taskToggled, (tasks, id) =>
    tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
  );
`;
  }

  if (kind === 'metrics') {
    return `import { createEvent, createStore } from "effector";

export type MetricWindow = "5m" | "1h" | "24h";

export const windowChanged = createEvent<MetricWindow>();

export const $window = createStore<MetricWindow>("5m").on(
  windowChanged,
  (_, nextWindow) => nextWindow,
);
`;
  }

  return `import { createEvent, createStore } from "effector";

export const specChanged = createEvent<string>();

export const $spec = createStore(${jsStringLiteral(prompt)}).on(
  specChanged,
  (_, spec) => spec,
);
`;
}

function viewSource(featureName: string, kind: FeatureKind, prompt: string): string {
  if (kind === 'auth') {
    return authView(featureName);
  }

  if (kind === 'todo') {
    return todoView(featureName);
  }

  if (kind === 'metrics') {
    return metricsView(featureName);
  }

  return genericView(featureName, prompt);
}

function authView(featureName: string): string {
  return `import React, { useState } from "react";

${shellStyle}

const card = {
  width: "min(420px, 100%)",
  border: "1px solid rgba(142, 182, 255, 0.24)",
  background: "#121a23",
  borderRadius: 12,
  padding: 20,
};

const label = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginTop: 12,
  fontSize: 12,
  color: "#93a4b8",
};

const field = {
  border: "1px solid rgba(158, 186, 214, 0.2)",
  borderRadius: 8,
  background: "#0c1218",
  color: "#d5dee8",
  padding: "10px 12px",
  fontSize: 14,
};

const submit = {
  marginTop: 16,
  width: "100%",
  border: 0,
  borderRadius: 8,
  background: "#3ee0b0",
  color: "#06221a",
  fontWeight: 700,
  padding: "10px 12px",
  cursor: "pointer",
};

const note = {
  minHeight: 20,
  margin: "12px 0 0",
  color: "#e6b35a",
  fontSize: 13,
};

export default function ${featureName}() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setMessage("Enter a valid email");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }
    setMessage("Session created for " + email);
  };

  return (
    <section style={shell}>
      <form style={card} onSubmit={handleSubmit}>
        <p style={{ margin: 0, color: "#8eb6ff", letterSpacing: "0.14em", fontSize: 11 }}>
          FEATURE / AUTH
        </p>
        <h2 style={{ margin: "8px 0 0", fontSize: 24 }}>Sign in</h2>
        <label style={label}>
          Email
          <input
            style={field}
            value={email}
            type="email"
            autoComplete="username"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label style={label}>
          Password
          <input
            style={field}
            value={password}
            type="password"
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button style={submit} type="submit">
          Create session
        </button>
        <p style={note}>{message}</p>
      </form>
    </section>
  );
}
`;
}

function todoView(featureName: string): string {
  return `import React, { useState } from "react";

${shellStyle}

const card = {
  width: "min(520px, 100%)",
  border: "1px solid rgba(62, 224, 176, 0.24)",
  background: "#121a23",
  borderRadius: 12,
  padding: 20,
};

const composer = {
  display: "flex",
  gap: 8,
  marginTop: 14,
};

const field = {
  flex: 1,
  border: "1px solid rgba(158, 186, 214, 0.2)",
  borderRadius: 8,
  background: "#0c1218",
  color: "#d5dee8",
  padding: "10px 12px",
  minWidth: 0,
};

const add = {
  border: 0,
  borderRadius: 8,
  background: "#3ee0b0",
  color: "#06221a",
  fontWeight: 700,
  padding: "0 14px",
  cursor: "pointer",
};

const item = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
  padding: "8px 10px",
  borderRadius: 8,
  background: "#0c1218",
};

export default function ${featureName}() {
  const [draft, setDraft] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, title: "Assemble the slice", done: true },
    { id: 2, title: "Check the preview", done: false },
  ]);

  const addTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) {
      return;
    }
    setTasks([...tasks, { id: Date.now(), title, done: false }]);
    setDraft("");
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const openCount = tasks.filter((task) => !task.done).length;

  return (
    <section style={shell}>
      <article style={card}>
        <p style={{ margin: 0, color: "#3ee0b0", letterSpacing: "0.14em", fontSize: 11 }}>
          FEATURE / TASKS
        </p>
        <h2 style={{ margin: "8px 0 0", fontSize: 24 }}>Slice queue</h2>
        <p style={{ margin: "8px 0 0", color: "#93a4b8" }}>Open: {openCount}</p>
        <form style={composer} onSubmit={addTask}>
          <input
            style={field}
            value={draft}
            placeholder="New task"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button style={add} type="submit">
            Add
          </button>
        </form>
        <div>
          {tasks.map((task) => (
            <label key={task.id} style={item}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span style={{ textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
            </label>
          ))}
        </div>
      </article>
    </section>
  );
}
`;
}

function metricsView(featureName: string): string {
  return `import React, { useState } from "react";

${shellStyle}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
  width: "min(640px, 100%)",
};

const card = {
  border: "1px solid rgba(142, 182, 255, 0.22)",
  background: "#121a23",
  borderRadius: 12,
  padding: 14,
};

const windows = ["5m", "1h", "24h"];

export default function ${featureName}() {
  const [windowName, setWindowName] = useState("5m");
  const multiplier = windowName === "24h" ? 18 : windowName === "1h" ? 4 : 1;
  const metrics = [
    { name: "Latency", value: 40 + multiplier + " ms", hint: "p95" },
    { name: "Tokens", value: 120 + multiplier * 3 + " / s", hint: "stream" },
    { name: "Errors", value: (0.2 * multiplier).toFixed(1) + "%", hint: windowName },
  ];

  return (
    <section style={shell}>
      <p style={{ margin: 0, color: "#8eb6ff", letterSpacing: "0.14em", fontSize: 11 }}>
        FEATURE / METRICS
      </p>
      <h2 style={{ margin: "8px 0 0", fontSize: 24 }}>Observability</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {windows.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setWindowName(item)}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(158, 186, 214, 0.24)",
              background: item === windowName ? "#3ee0b0" : "transparent",
              color: item === windowName ? "#06221a" : "#d5dee8",
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div style={{ ...grid, marginTop: 14 }}>
        {metrics.map((metric) => (
          <article key={metric.name} style={card}>
            <p style={{ margin: 0, color: "#93a4b8", fontSize: 12 }}>{metric.name}</p>
            <p style={{ margin: "8px 0 0", fontSize: 22 }}>{metric.value}</p>
            <p style={{ margin: "6px 0 0", color: "#3ee0b0", fontSize: 12 }}>{metric.hint}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
`;
}

function genericView(featureName: string, prompt: string): string {
  const spec = jsStringLiteral(prompt.trim());

  return `import React, { useState } from "react";

${shellStyle}

const spec = ${spec};

export default function ${featureName}() {
  const [checks, setChecks] = useState(0);

  return (
    <section style={shell}>
      <article
        style={{
          width: "min(560px, 100%)",
          border: "1px solid rgba(62, 224, 176, 0.24)",
          background: "#121a23",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <p style={{ margin: 0, color: "#3ee0b0", letterSpacing: "0.14em", fontSize: 11 }}>
          FEATURE / ${featureName}
        </p>
        <h2 style={{ margin: "8px 0 0", fontSize: 24 }}>${featureName}</h2>
        <p style={{ margin: "10px 0 0", color: "#93a4b8", lineHeight: 1.5 }}>{spec}</p>
        <button
          type="button"
          onClick={() => setChecks(checks + 1)}
          style={{
            marginTop: 16,
            border: 0,
            borderRadius: 8,
            background: "#8eb6ff",
            color: "#081018",
            fontWeight: 700,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Mark check
        </button>
        <p style={{ margin: "12px 0 0", fontFamily: "ui-monospace, monospace" }}>checks: {checks}</p>
      </article>
    </section>
  );
}
`;
}

function jsStringLiteral(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '').replace(/\n/g, '\\n')}'`;
}

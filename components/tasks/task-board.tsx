"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, User, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { addTask, toggleTask, deleteTask } from "@/lib/actions";

export type Task = {
  id: string;
  title: string;
  category: "work" | "personal";
  completed: boolean;
};

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TaskColumn
        category="work"
        title="Work"
        icon={<Briefcase className="h-4 w-4" />}
        tasks={tasks.filter((t) => t.category === "work")}
      />
      <TaskColumn
        category="personal"
        title="Personal"
        icon={<User className="h-4 w-4" />}
        tasks={tasks.filter((t) => t.category === "personal")}
      />
    </div>
  );
}

function TaskColumn({
  category,
  title,
  icon,
  tasks,
}: {
  category: "work" | "personal";
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const active = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  function add() {
    const title = draft.trim();
    if (!title) return;
    setError(null);
    setDraft("");
    const data = new FormData();
    data.set("title", title);
    data.set("category", category);
    startTransition(async () => {
      const res = await addTask({ ok: false }, data);
      if (!res.ok) setError(res.error ?? "Couldn’t add that.");
      router.refresh();
    });
  }

  function toggle(id: string, completed: boolean) {
    startTransition(async () => {
      await toggleTask(id, completed);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteTask(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {active.length} open
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add */}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={`Add a ${title.toLowerCase()} task…`}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        {/* Open tasks */}
        <ul className="space-y-1.5">
          {active.length === 0 && done.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">
              Nothing here yet. Add your first {title.toLowerCase()} task above.
            </li>
          ) : null}
          {active.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={remove} />
          ))}
        </ul>

        {/* Completed */}
        {done.length ? (
          <div className="pt-1">
            <div className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              Completed · {done.length}
            </div>
            <ul className="space-y-1.5">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={remove} />
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="group flex items-center gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2">
      <button
        type="button"
        onClick={() => onToggle(task.id, !task.completed)}
        aria-label={task.completed ? "Mark not done" : "Mark done"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-colors",
          task.completed
            ? "border-emerald-500 bg-emerald-500 text-black"
            : "border-muted-foreground hover:border-primary"
        )}
      >
        {task.completed ? "✓" : ""}
      </button>
      <span className={cn("min-w-0 flex-1 break-words text-sm", task.completed && "text-muted-foreground line-through")}>
        {task.title}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

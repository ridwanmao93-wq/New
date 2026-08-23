"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, User, Plus, Trash2, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { addTask, toggleTask, deleteTask, updateTask } from "@/lib/actions";

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  category: "work" | "personal";
  completed: boolean;
  description?: string | null;
  priority?: Priority | null;
  due_date?: string | null;
  duration_minutes?: number | null;
};

const PRIORITY_META: Record<Priority, { label: string; dot: string; chip: string }> = {
  high: { label: "High", dot: "bg-red-500", chip: "bg-red-500/15 text-red-300" },
  medium: { label: "Medium", dot: "bg-amber-500", chip: "bg-amber-500/15 text-amber-300" },
  low: { label: "Low", dot: "bg-sky-500", chip: "bg-sky-500/15 text-sky-300" },
};

function fmtDate(d?: string | null) {
  if (!d) return null;
  const parsed = new Date(d + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const [openTask, setOpenTask] = useState<Task | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TaskColumn
          category="work"
          title="Work"
          icon={<Briefcase className="h-4 w-4" />}
          tasks={tasks.filter((t) => t.category === "work")}
          onOpen={setOpenTask}
        />
        <TaskColumn
          category="personal"
          title="Personal"
          icon={<User className="h-4 w-4" />}
          tasks={tasks.filter((t) => t.category === "personal")}
          onOpen={setOpenTask}
        />
      </div>

      {openTask ? <TaskDialog task={openTask} onClose={() => setOpenTask(null)} /> : null}
    </>
  );
}

function TaskColumn({
  category,
  title,
  icon,
  tasks,
  onOpen,
}: {
  category: "work" | "personal";
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onOpen: (t: Task) => void;
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

        <ul className="space-y-1.5">
          {active.length === 0 && done.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted-foreground">
              Nothing here yet. Add your first {title.toLowerCase()} task above.
            </li>
          ) : null}
          {active.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={remove} onOpen={onOpen} />
          ))}
        </ul>

        {done.length ? (
          <div className="pt-1">
            <div className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              Completed · {done.length}
            </div>
            <ul className="space-y-1.5">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={remove} onOpen={onOpen} />
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
  onOpen,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onOpen: (t: Task) => void;
}) {
  const pr = task.priority ? PRIORITY_META[task.priority] : null;
  const due = fmtDate(task.due_date);
  const hasMeta = pr || due || task.duration_minutes || task.description;

  return (
    <li
      onClick={() => onOpen(task)}
      className="group flex cursor-pointer items-center gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id, !task.completed);
        }}
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

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-2 text-sm",
            task.completed && "text-muted-foreground line-through"
          )}
        >
          {pr ? <span className={cn("h-2 w-2 shrink-0 rounded-full", pr.dot)} /> : null}
          <span className="min-w-0 break-words">{task.title}</span>
        </div>
        {hasMeta && !task.completed ? (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {due ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {due}
              </span>
            ) : null}
            {task.duration_minutes ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.duration_minutes}m
              </span>
            ) : null}
            {task.description ? <span className="truncate opacity-80">· {task.description}</span> : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        aria-label="Delete task"
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function TaskDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<"work" | "personal">(task.category);
  const [priority, setPriority] = useState<Priority>(task.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [duration, setDuration] = useState(task.duration_minutes ? String(task.duration_minutes) : "");
  const [description, setDescription] = useState(task.description ?? "");
  const [completed, setCompleted] = useState(task.completed);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function save() {
    if (!title.trim()) {
      setError("Give the task a title.");
      return;
    }
    setSaving(true);
    setError(null);
    const data = new FormData();
    data.set("id", task.id);
    data.set("title", title.trim());
    data.set("category", category);
    data.set("priority", priority);
    data.set("description", description);
    data.set("due_date", dueDate);
    data.set("duration_minutes", duration);
    data.set("completed", completed ? "true" : "false");
    const res = await updateTask({ ok: false }, data);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn’t save.");
      return;
    }
    onClose();
    router.refresh();
  }

  function remove() {
    startTransition(async () => {
      await deleteTask(task.id);
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title + complete */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setCompleted((c) => !c)}
            aria-label={completed ? "Mark not done" : "Mark done"}
            className={cn(
              "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm transition-colors",
              completed
                ? "border-emerald-500 bg-emerald-500 text-black"
                : "border-muted-foreground hover:border-primary"
            )}
          >
            {completed ? "✓" : ""}
          </button>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground",
              completed && "text-muted-foreground line-through"
            )}
            placeholder="Task title"
          />
        </div>

        <div className="mt-4 space-y-4">
          {/* Category + priority */}
          <div className="grid grid-cols-2 gap-4">
            <Segment
              label="List"
              value={category}
              options={[
                { value: "work", label: "Work" },
                { value: "personal", label: "Personal" },
              ]}
              onChange={(v) => setCategory(v as "work" | "personal")}
            />
            <Segment
              label="Priority"
              value={priority}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Med" },
                { value: "high", label: "High" },
              ]}
              onChange={(v) => setPriority(v as Priority)}
            />
          </div>

          {/* Due date + duration */}
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Due date
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Time estimate
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </label>
          </div>

          {/* Description */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description &amp; notes
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add detail, context, links, sub-steps…"
              className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Segment({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex rounded-md border border-border p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors",
              value === o.value
                ? "bg-primary text-black"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

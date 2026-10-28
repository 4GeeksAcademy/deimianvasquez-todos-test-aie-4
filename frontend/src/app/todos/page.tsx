"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/context/auth-context";
import { hasAccount } from "@/lib/account";
import { api } from "@/lib/api";

type Task = {
  id: number;
  title: string;
  done: boolean;
};

type Filter = "all" | "pending" | "done";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Por hacer" },
  { id: "done", label: "Completadas" },
];

export default function TodosPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const visibleTasks = tasks?.filter((task) => {
    if (filter === "pending") {
      return !task.done;
    }
    if (filter === "done") {
      return task.done;
    }
    return true;
  });

  function startEdit(task: Task) {
    setEditingId(task.id);
    setDraft(task.title);
  }

  async function saveEdit(task: Task) {
    const nextTitle = draft.trim();
    if (!nextTitle) {
      return;
    }
    setError("");
    const response = await api(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: nextTitle }),
    });
    if (!response.ok) {
      setError("No se pudo actualizar la tarea.");
      return;
    }
    const updated: Task = await response.json();
    setTasks((current) =>
      current?.map((item) => (item.id === updated.id ? updated : item)) ?? null,
    );
    setEditingId(null);
  }

  async function markFinished(task: Task) {
    setError("");
    const response = await api(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ done: !task.done }),
    });
    if (!response.ok) {
      setError("No se pudo actualizar la tarea.");
      return;
    }
    const updated: Task = await response.json();
    setTasks((current) =>
      current?.map((item) => (item.id === updated.id ? updated : item)) ?? null,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }
    setError("");
    const response = await api("/tasks", {
      method: "POST",
      body: JSON.stringify({ title: nextTitle }),
    });
    if (!response.ok) {
      setError("No se pudo agregar la tarea.");
      return;
    }
    const created: Task = await response.json();
    setTasks((current) => (current ? [...current, created] : [created]));
    setTitle("");
  }

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user) {
      router.replace(hasAccount() ? "/login" : "/register");
      return;
    }

    let active = true;

    api("/tasks")
      .then(async (response) => {
        if (!active) {
          return;
        }
        if (!response.ok) {
          setError("No se pudieron cargar tus tareas.");
          return;
        }
        setTasks(await response.json());
      })
      .catch(() => {
        if (active) {
          setError("No se pudo conectar con el servidor.");
        }
      });

    return () => {
      active = false;
    };
  }, [ready, router, user]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-950 text-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Mis tareas</h1>
        {user ? (
          <form onSubmit={onSubmit} className="mt-8 flex gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nueva tarea"
              className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-100"
            />
            <button
              type="submit"
              className="rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950"
            >
              Agregar
            </button>
          </form>
        ) : null}
        {tasks && tasks.length > 0 ? (
          <div className="mt-6 flex gap-2">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={
                  filter === item.id
                    ? "rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-950"
                    : "rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-300"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {error ? <p className="mt-6 text-stone-400">{error}</p> : null}
        {tasks === null && !error ? (
          <p className="mt-6 text-stone-400">Comprobando sesión...</p>
        ) : null}
        {tasks?.length === 0 ? (
          <p className="mt-6 text-stone-400">Todavía no tienes tareas.</p>
        ) : null}
        {visibleTasks && tasks && tasks.length > 0 && visibleTasks.length === 0 ? (
          <p className="mt-6 text-stone-400">
            {filter === "done"
              ? "No hay tareas completadas."
              : "No hay tareas por hacer."}
          </p>
        ) : null}
        {visibleTasks && visibleTasks.length > 0 ? (
          <ul className="mt-8 divide-y divide-stone-800 rounded-2xl border border-stone-800">
            {visibleTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-4 px-5 py-4">
                {editingId === task.id ? (
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100"
                  />
                ) : (
                  <span className={task.done ? "text-stone-500 line-through" : ""}>
                    {task.title}
                  </span>
                )}
                <div className="flex shrink-0 gap-2">
                  {editingId === task.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEdit(task)}
                        className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-950"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-full border border-stone-600 px-4 py-2 text-sm text-stone-100"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      className="rounded-full border border-stone-600 px-4 py-2 text-sm text-stone-100"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => markFinished(task)}
                    className="rounded-full border border-stone-600 px-4 py-2 text-sm text-stone-100"
                  >
                    {task.done ? "Reabrir" : "Finalizar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}

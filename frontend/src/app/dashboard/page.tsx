"use client";

import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";

type TelemetryStats = {
  total_events: number;
  by_event: Record<string, number>;
  recent_events: TelemetryEvent[];
};

type TelemetryEvent = {
  id: number;
  event: string;
  timestamp: string;
  context: { route: string };
  properties: Record<string, unknown>;
};

const EVENT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  page_view: { label: "Vistas de página", emoji: "👁️", color: "#4f8ff7" },
  login_attempted: { label: "Intentos de login", emoji: "🔑", color: "#f59e0b" },
  todo_created: { label: "Tareas creadas", emoji: "✅", color: "#10b981" },
  todo_completed: { label: "Tareas completadas", emoji: "🎯", color: "#3b82f6" },
  todo_deleted: { label: "Tareas eliminadas", emoji: "🗑️", color: "#ef4444" },
  contact_created: { label: "Contactos", emoji: "📬", color: "#8b5cf6" },
};

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function eventLabel(event: string) {
  return EVENT_LABELS[event] ?? { label: event, emoji: "📡", color: "#6b7280" };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api("/telemetry/stats")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setError("No se pudieron cargar las estadísticas.");
          return;
        }
        setStats(await response.json());
      })
      .catch(() => {
        if (active) setError("No se pudo conectar con el servidor.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-950 text-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 text-stone-400">
          Estadísticas de uso de la aplicación.
        </p>

        {loading ? (
          <p className="mt-6 text-stone-400">Cargando datos...</p>
        ) : null}

        {error ? <p className="mt-6 text-red-400">{error}</p> : null}

        {stats ? (
          <>
            {/* ─── Tarjetas de resumen ─── */}
            <section className="mt-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {/* Tarjeta de total */}
                <div className="flex flex-col gap-1 rounded-2xl border border-stone-700 bg-stone-900 px-5 py-6">
                  <p className="text-sm text-stone-400">Total eventos</p>
                  <p className="text-4xl font-bold tracking-tight">{stats.total_events}</p>
                </div>

                {/* Una tarjeta por tipo de evento */}
                {Object.entries(stats.by_event).map(([event, count]) => {
                  const meta = eventLabel(event);
                  return (
                    <div
                      key={event}
                      className="flex flex-col gap-1 rounded-2xl border border-stone-700 bg-stone-900 px-5 py-6"
                    >
                      <p className="flex items-center gap-2 text-sm text-stone-400">
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </p>
                      <p className="text-3xl font-bold tracking-tight">{count}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── Gráfico de barras horizontal ─── */}
            <section className="mt-10">
              <h2 className="text-2xl font-semibold tracking-tight">Distribución</h2>
              <div className="mt-6 flex flex-col gap-4">
                {Object.entries(stats.by_event).map(([event, count]) => {
                  const meta = eventLabel(event);
                  const pct =
                    stats.total_events > 0
                      ? Math.round((count / stats.total_events) * 100)
                      : 0;
                  return (
                    <div key={event} className="flex items-center gap-3">
                      <span className="w-8 shrink-0 text-lg">{meta.emoji}</span>
                      <span className="w-32 shrink-0 text-sm text-stone-300">
                        {meta.label}
                      </span>
                      <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-sm text-stone-300">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── Últimos eventos ─── */}
            <section className="mt-10">
              <h2 className="text-2xl font-semibold tracking-tight">
                Actividad reciente
              </h2>
              {stats.recent_events.length === 0 ? (
                <p className="mt-4 text-stone-400">No hay eventos todavía.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full divide-y divide-stone-800 rounded-2xl border border-stone-800 text-left text-sm">
                    <thead className="text-stone-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Evento</th>
                        <th className="px-4 py-3 font-medium">Ruta</th>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800 text-stone-300">
                      {stats.recent_events.map((ev) => {
                        const meta = eventLabel(ev.event);
                        return (
                          <tr key={ev.id}>
                            <td className="px-4 py-3">
                              <span className="mr-2">{meta.emoji}</span>
                              {meta.label}
                            </td>
                            <td className="px-4 py-3 font-mono">{ev.context.route}</td>
                            <td className="px-4 py-3">{formatTimestamp(ev.timestamp)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";

type DailyVolume = { date: string; event_count: number };
type EventTypeCount = { event: string; event_count: number };
type RouteActivity = { date: string; route: string; event_count: number };
type TelemetryReport = {
  period: { from: string; to: string };
  metrics: {
    volume_by_day: DailyVolume[];
    event_types_breakdown: EventTypeCount[];
    route_activity_by_day: RouteActivity[];
  };
};

function formatPeriod(value: string): string {
  return new Date(value).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

function formatDay(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("es-ES", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}

const PRESETS: { label: string; days: number }[] = [
  { label: "24 h", days: 1 },
  { label: "7 días", days: 7 },
  { label: "14 días", days: 14 },
  { label: "30 días", days: 30 },
];

/** Retorna fecha ISO (YYYY-MM-DD) para el input type=date */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadCSV(report: TelemetryReport): void {
  const lines: string[] = [];
  const nl = "\r\n";

  // ─── Volumen diario ───
  lines.push("=== Volumen diario ===");
  lines.push("date,event_count");
  for (const row of report.metrics.volume_by_day) {
    lines.push(`${row.date},${row.event_count}`);
  }
  lines.push("");

  // ─── Eventos por tipo ───
  lines.push("=== Eventos por tipo ===");
  lines.push("event,event_count");
  for (const row of report.metrics.event_types_breakdown) {
    lines.push(`${row.event},${row.event_count}`);
  }
  lines.push("");

  // ─── Actividad por ruta ───
  lines.push("=== Actividad por ruta ===");
  lines.push("date,route,event_count");
  for (const row of report.metrics.route_activity_by_day) {
    lines.push(`${row.date},${row.route},${row.event_count}`);
  }

  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join(nl)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const periodFrom = report.period.from.slice(0, 10);
  const periodTo = report.period.to.slice(0, 10);
  anchor.download = `telemetry-report_${periodFrom}_${periodTo}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TelemetryReportPage() {
  const [report, setReport] = useState<TelemetryReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // ─── Estado de los filtros ────────────────────────────────
  const [presetDays, setPresetDays] = useState<number>(7);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // ─── Carga diferida ───────────────────────────────────────
  function load(days: number, from?: string, to?: string) {
    setLoading(true);
    setError("");
    setReport(null);

    const params = new URLSearchParams();

    if (from && to) {
      params.set("start_date", `${from}T00:00:00Z`);
      params.set("end_date", `${to}T23:59:59Z`);
    } else if (days < 0) {
      // sin fechas — usa default del backend (7 días)
    } else {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - days);
      params.set("start_date", `${start.toISOString().slice(0, 10)}T00:00:00Z`);
      params.set("end_date", `${end.toISOString().slice(0, 10)}T23:59:59Z`);
    }

    const qs = params.toString();
    const url = qs ? `/telemetry/report?${qs}` : "/telemetry/report";

    api(url)
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar el reporte técnico.");
        setReport((await response.json()) as TelemetryReport);
      })
      .catch(() => setError("No se pudo conectar con el servicio de telemetría."))
      .finally(() => setLoading(false));
  }

  // ─── Arranque con 7 días por defecto ──────────────────────
  useEffect(() => {
    let active = true;
    api("/telemetry/report")
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar el reporte técnico.");
        if (active) setReport((await response.json()) as TelemetryReport);
      })
      .catch(() => { if (active) setError("No se pudo conectar con el servicio de telemetría."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────
  function onPresetClick(days: number) {
    setPresetDays(days);
    setCustomFrom("");
    setCustomTo("");
    load(days);
  }

  function onCustomApply() {
    const from = customFrom || todayISO();
    const to = customTo || todayISO();
    setPresetDays(-1);
    setCustomFrom(from);
    setCustomTo(to);
    load(-1, from, to);
  }

  // ─── Derivados ────────────────────────────────────────────
  const totalEvents =
    report?.metrics.volume_by_day.reduce(
      (total, day) => total + day.event_count,
      0,
    ) ?? 0;
  const peakDay = report?.metrics.volume_by_day.reduce<DailyVolume | null>(
    (peak, day) => (!peak || day.event_count > peak.event_count ? day : peak),
    null,
  );
  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-950 text-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">

        {/* ─── Encabezado ───────────────────────────────── */}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-400">OPERACIONES</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Reporte técnico</h1>
            <p className="mt-3 max-w-2xl text-stone-400">
              Volumen y distribución de eventos capturados por el sistema.
            </p>
          </div>
          {report ? (
            <button
              type="button"
              onClick={() => downloadCSV(report)}
              className="shrink-0 rounded-full border border-emerald-700 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-300"
            >
              Exportar CSV
            </button>
          ) : null}
        </div>

        {/* ─── Filtros ──────────────────────────────────── */}

        <section aria-label="Filtro de fechas" className="mt-5 rounded-2xl border border-stone-800 bg-stone-900 p-4 sm:px-5 sm:py-4">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Ventana de tiempo</legend>
            {PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => onPresetClick(p.days)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  presetDays === p.days
                    ? "border-emerald-500 bg-emerald-600/30 text-emerald-300"
                    : "border-stone-700 bg-stone-950 text-stone-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </fieldset>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-0.5 text-xs text-stone-500">
              Desde
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-stone-700 bg-stone-950 px-3 py-1.5 text-sm text-stone-200"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-xs text-stone-500">
              Hasta
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-stone-700 bg-stone-950 px-3 py-1.5 text-sm text-stone-200"
              />
            </label>
            <button
              type="button"
              onClick={onCustomApply}
              className="self-end rounded-full border border-sky-600 bg-sky-950/50 px-4 py-1.5 text-sm text-sky-300"
            >
              Aplicar fechas
            </button>
          </div>
        </section>

        {/* ─── Estados ──────────────────────────────────── */}

        {loading ? <p className="mt-6 text-stone-400">Cargando reporte...</p> : null}
        {error ? (
          <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">{error}</p>
        ) : null}

        {/* ─── Contenido ────────────────────────────────── */}

        {report ? (
          <>
            <section aria-label="Periodo del reporte" className="mt-4 rounded-2xl border border-stone-800 bg-stone-900 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Periodo consultado (inicio incluido, fin excluido)</p>
              <p className="mt-2 text-sm text-stone-200">
                {formatPeriod(report.period.from)} <span className="px-2 text-stone-500">→</span> {formatPeriod(report.period.to)}
              </p>
            </section>

            <section aria-label="Resumen operacional" className="mt-5 grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
                <p className="text-sm text-stone-400">Eventos en el periodo</p>
                <p className="mt-2 text-4xl font-bold">{totalEvents}</p>
              </article>
              <article className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
                <p className="text-sm text-stone-400">Día con más actividad</p>
                <p className="mt-2 text-2xl font-semibold">{peakDay ? formatDay(peakDay.date) : "Sin actividad"}</p>
                {peakDay ? <p className="mt-1 text-sm text-stone-400">{peakDay.event_count} eventos</p> : null}
              </article>
            </section>

            <section className="mt-10 rounded-2xl border border-stone-800 bg-stone-900 p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Volumen diario</h2>
              <p className="mt-1 text-sm text-stone-400">Cantidad de eventos agrupados por día UTC.</p>
              {report.metrics.volume_by_day.length === 0 ? (
                <p className="mt-6 text-sm text-stone-500">No hay eventos en este periodo.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {report.metrics.volume_by_day.map((item) => {
                    const maxVol = Math.max(1, ...report.metrics.volume_by_day.map((d) => d.event_count));
                    return (
                      <div key={item.date} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
                        <span className="text-sm text-stone-300">{formatDay(item.date)}</span>
                        <div className="h-3 overflow-hidden rounded-full bg-stone-800">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.max(4, (item.event_count / maxVol) * 100)}%` }}
                          />
                        </div>
                        <span className="text-right text-sm tabular-nums text-stone-300">{item.event_count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-5 flex flex-col gap-5">
              <article className="rounded-2xl border border-stone-800 bg-stone-900 p-5 sm:p-6">
                <h2 className="text-xl font-semibold">Eventos por tipo</h2>
                <p className="mt-1 text-sm text-stone-400">Tipos más frecuentes en el periodo.</p>
                {report.metrics.event_types_breakdown.length === 0 ? (
                  <p className="mt-6 text-sm text-stone-500">No hay eventos para clasificar.</p>
                ) : (() => {
                  const maxType = Math.max(1, ...report.metrics.event_types_breakdown.map((t) => t.event_count));
                  const colors = ["bg-sky-500", "bg-sky-400", "bg-sky-600", "bg-sky-300"];
                  return (
                    <div className="mt-6 space-y-5">
                      {report.metrics.event_types_breakdown.map((item, i) => (
                        <div key={item.event} className="group relative">
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="break-all font-mono text-sm text-stone-200">{item.event}</span>
                            <span className="shrink-0 rounded-full bg-stone-800 px-2.5 py-0.5 text-xs tabular-nums text-stone-400">
                              {item.event_count}
                            </span>
                          </div>
                          <div className="mt-1.5 h-3 rounded-full bg-stone-800/60">
                            <div
                              className={`h-full rounded-full ${colors[i % colors.length]}`}
                              style={{ width: `${(item.event_count / maxType) * 100}%` }}
                            />
                          </div>
                          {i < report.metrics.event_types_breakdown.length - 1 ? (
                            <div className="mt-4" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </article>

              <article className="rounded-2xl border border-stone-800 bg-stone-900 p-5 sm:p-6">
                <h2 className="text-xl font-semibold">Actividad por ruta</h2>
                <p className="mt-1 text-sm text-stone-400">Eventos agrupados por día y ruta de la aplicación.</p>
                {report.metrics.route_activity_by_day.length === 0 ? (
                  <p className="mt-6 text-sm text-stone-500">No hay rutas disponibles en este periodo.</p>
                ) : (() => {
                  const maxRoute = Math.max(1, ...report.metrics.route_activity_by_day.map((r) => r.event_count));
                  const grouped: Record<string, RouteActivity[]> = {};
                  for (const row of report.metrics.route_activity_by_day) {
                    (grouped[row.date] ??= []).push(row);
                  }
                  const sortedDates = Object.keys(grouped).sort();
                  return (
                    <div className="mt-5 max-h-72 overflow-y-auto space-y-4">
                      {sortedDates.map((date) => (
                        <div key={date}>
                          <p className="mb-1.5 text-xs font-semibold tracking-wide text-stone-500">
                            {formatDay(date)}
                          </p>
                          <div className="space-y-2.5">
                            {grouped[date].map((item, idx) => (
                              <div key={`${item.route}-${idx}`} className="flex items-center gap-4">
                                <span className="w-48 truncate break-all font-mono text-xs text-stone-400" title={item.route}>
                                  {item.route}
                                </span>
                                <div className="h-2 rounded-full bg-stone-800/60">
                                  <div
                                    className="h-full rounded-full bg-amber-500"
                                    style={{ width: `${Math.max(4, (item.event_count / maxRoute) * 100)}%` }}
                                  />
                                </div>
                                <span className="tabular-nums text-xs text-stone-400">{item.event_count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </article>
            </section>

            <p className="mt-6 text-xs leading-5 text-stone-500">
              El catálogo actual no registra latencia de solicitudes ni errores técnicos de backend;
              esas métricas no se infieren de los eventos de uso disponibles.
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}

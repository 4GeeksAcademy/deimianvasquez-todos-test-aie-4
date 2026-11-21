"use client";

// ─── IDs (sesión y anónimo) ───

let cachedSessionId: string | null = null;

function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  cachedSessionId = crypto.randomUUID();
  return cachedSessionId;
}

function getAnonymousId(): string | null {
  try {
    let id = localStorage.getItem("telemetry_anonymous_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("telemetry_anonymous_id", id);
    }
    return id;
  } catch {
    return null;
  }
}

// ─── Consentimiento ───

/** Retorna el consentimiento o null si nunca se preguntó. */
export function getConsent(): { analytics: boolean } | null {
  try {
    const stored = localStorage.getItem("telemetry_consent");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function setConsent(enabled: boolean): void {
  localStorage.setItem("telemetry_consent", JSON.stringify({ analytics: enabled }));
}

// ─── Entorno ───

function getEnv(): string {
  try {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "development";
  } catch {}
  return "development";
}

// ─── Sanitizar ───

function sanitizeText(text: string): string {
  let result = text.slice(0, 200);
  result = result.replace(/[\w.+-]+@[\w.-]+\.[\w]{2,}/g, "[email]");
  result = result.replace(
    /\+?\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}/g,
    "[phone]",
  );
  return result;
}

// ─── Lista blanca por evento ───

const ALLOWED_PROPERTIES: Record<string, string[]> = {
  page_view: ["url", "route", "referrer"],
  login_attempted: ["method", "success"],
  todo_created: ["todo_id"],
  todo_completed: ["todo_id"],
  todo_deleted: ["todo_id"],
  contact_created: ["contact_id"],
};

function filterProperties(
  event: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = ALLOWED_PROPERTIES[event];
  if (!allowed) return {};
  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in props) filtered[key] = props[key];
  }
  return filtered;
}

// ─── Tipos ───

export interface TelemetryEvent {
  event: string;
  timestamp: string;
  user: {
    userId: string | null;
    anonymousId: string | null;
    sessionId: string;
  };
  context: {
    appVersion: string;
    env: string;
    route: string;
  };
  properties: Record<string, unknown>;
}

// ─── Buffer de eventos ───

const buffer: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

const FLUSH_INTERVAL = 3_000; // 3 segundos
const MAX_BUFFER_SIZE = 50;

// ─── Envío al backend ───

function getApiBase(): string {
  if (typeof window === "undefined") return "http://localhost:8000";
  if (window.location.hostname.endsWith(".app.github.dev")) {
    const backendHost = window.location.hostname.replace(
      /-\d+\.app\.github\.dev$/,
      "-8000.app.github.dev",
    );
    return `https://${backendHost}`;
  }
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${window.location.hostname}:8000`;
}

async function sendBatch(events: TelemetryEvent[]): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/telemetry/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

function sendWithRetry(events: TelemetryEvent[], attempt: number): void {
  sendBatch(events).then((ok) => {
    if (ok) {
      isFlushing = false;
      return;
    }
    if (attempt < 3) {
      const delays = [1_000, 2_000, 4_000]; // 1s, 2s, 4s
      setTimeout(() => sendWithRetry(events, attempt + 1), delays[attempt]);
    } else {
      console.error("[telemetry] Lote descartado tras 4 intentos fallidos");
      isFlushing = false;
    }
  });
}

function flush(): void {
  if (isFlushing || buffer.length === 0) return;
  isFlushing = true;
  const batch = buffer.splice(0, buffer.length);
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  sendWithRetry(batch, 0);
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, FLUSH_INTERVAL);
  if (buffer.length >= MAX_BUFFER_SIZE) flush();
}

// ─── sendBeacon al ocultar la página ───

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.hidden && buffer.length > 0) {
      const batch = buffer.splice(0, buffer.length);
      try {
        navigator.sendBeacon(
          `${getApiBase()}/telemetry/events`,
          new Blob([JSON.stringify({ events: batch })], {
            type: "application/json",
          }),
        );
      } catch {
        // silencioso
      }
    }
  });
}

// ─── guardEvent: la función principal ───

export function guardEvent(
  eventName: string,
  properties: Record<string, unknown>,
  options?: { userId?: string | null },
): TelemetryEvent | null {
  // 1. Consentimiento
  const consent = getConsent();
  if (consent === null || !consent.analytics) return null;

  // 2. Sanitizar campos libres
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    sanitized[key] = typeof value === "string" ? sanitizeText(value) : value;
  }

  // 3. Lista blanca (solo campos permitidos para este evento)
  const filtered = filterProperties(eventName, sanitized);

  // 4. Muestreo: estos eventos van al 100 %

  // 5. Log en consola siempre (útil para debug)
  const env = getEnv();
  console.log(`[telemetry] ${eventName}`, filtered);

  // Armar el evento completo
  const event: TelemetryEvent = {
    event: eventName,
    timestamp: new Date().toISOString(),
    user: {
      userId: options?.userId ?? null,
      anonymousId: options?.userId ? null : getAnonymousId(),
      sessionId: getSessionId(),
    },
    context: {
      appVersion: "0.1.0",
      env,
      route: window.location.pathname,
    },
    properties: filtered,
  };

  // Encolar y programar envío
  buffer.push(event);
  scheduleFlush();

  return event;
}

// ─── track: atajo sin opciones ───

export function track(
  eventName: string,
  properties: Record<string, unknown>,
): void {
  guardEvent(eventName, properties);
}
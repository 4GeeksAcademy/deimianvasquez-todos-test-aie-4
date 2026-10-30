function apiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }
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

export function api(path: string, options: RequestInit = {}) {
  return fetch(`${apiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

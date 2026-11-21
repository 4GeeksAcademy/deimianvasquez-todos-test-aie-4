"use client";

import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { guardEvent } from "@/lib/telemetry";

export function PageViewTracker() {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    const url = window.location.href;
    const route = window.location.pathname;
    const referrer = document.referrer || null;

    guardEvent("page_view", {
      url,
      route,
      referrer,
    }, {
      userId: user?.id ? String(user.id) : null,
    });
  }, [ready]);

  return null;
}
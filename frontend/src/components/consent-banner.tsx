"use client";

import { useEffect, useState } from "react";

import { getConsent, setConsent } from "@/lib/telemetry";

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    // Muestra el banner si nunca se preguntó (null)
    setShow(consent === null);
  }, []);

  function accept() {
    setConsent(true);
    setShow(false);
  }

  function reject() {
    setConsent(false);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-stone-800 bg-stone-900 px-6 py-3">
      <p className="text-sm text-stone-400">
        Esta aplicación usa telemetría básica para mejorar la experiencia.
        No recopilamos datos personales.
      </p>
      <div className="flex gap-2">
        <button
          className="cursor-pointer rounded bg-stone-700 px-4 py-1.5 text-sm font-medium text-stone-100"
          onClick={accept}
        >
          Aceptar
        </button>
        <button
          className="cursor-pointer rounded bg-stone-800 px-4 py-1.5 text-sm font-medium text-stone-300"
          onClick={reject}
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
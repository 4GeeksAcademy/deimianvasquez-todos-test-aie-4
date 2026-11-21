"use client";

import { FormEvent, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { guardEvent } from "@/lib/telemetry";
import { api } from "@/lib/api";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(false);
    const response = await api("/contacts", {
      method: "POST",
      body: JSON.stringify({ name, email, message }),
    });
    if (!response.ok) {
      setError("No se pudo enviar el mensaje. Intenta de nuevo.");
      return;
    }
    const created = await response.json();
    guardEvent("contact_created", { contact_id: created.id } as Record<string, unknown>);
    setName("");
    setEmail("");
    setMessage("");
    setSent(true);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-950 text-stone-100">
      <SiteHeader />

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-24">
        <p className="text-sm font-medium tracking-wide text-stone-400 uppercase">
          Tu lista, en un solo lugar
        </p>
        <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-tight text-balance">
          Organiza el día con Deimiantask
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-stone-400">
          Guarda lo que tienes pendiente y vuelve a verlo cuando inicies sesión.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Contacto</h2>
        <p className="mt-2 text-sm text-stone-400">
          ¿Tienes alguna pregunta o sugerencia? Escríbenos.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm text-stone-300">
            Nombre
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-300">
            Correo
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-300">
            Mensaje
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-100"
            />
          </label>
          {error ? <p className="text-sm text-stone-300">{error}</p> : null}
          {sent ? <p className="text-sm text-green-400">¡Mensaje enviado!</p> : null}
          <button
            type="submit"
            className="rounded-full bg-stone-100 px-4 py-3 text-sm font-medium text-stone-950"
          >
            Enviar
          </button>
        </form>
      </section>

      <footer className="border-t border-stone-800 bg-stone-900">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-sm text-stone-400">
          <p>Deimiantask</p>
          <p>Lista de tareas</p>
        </div>
      </footer>
    </div>
  );
}

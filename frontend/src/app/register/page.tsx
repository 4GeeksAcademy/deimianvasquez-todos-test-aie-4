"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { markAccount } from "@/lib/account";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await api("/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (response.status === 409) {
        markAccount();
        setError("Ese correo ya está registrado. Inicia sesión.");
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.detail ?? "No se pudo crear la cuenta.");
        return;
      }
      markAccount();
      router.push("/login");
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-950 text-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="mt-3 text-stone-400">
          Regístrate para guardar tus tareas. Te enviaremos un correo de bienvenida.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm text-stone-300">
            Nombre
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-300">
            Correo
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-300">
            Contraseña
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-100"
            />
          </label>
          {error ? <p className="text-sm text-stone-300">{error}</p> : null}
          <button
            type="submit"
            className="mt-2 rounded-full bg-stone-100 px-4 py-3 text-sm font-medium text-stone-950"
          >
            Registrarme
          </button>
        </form>
        <p className="mt-6 text-sm text-stone-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-stone-100 underline">
            Inicia sesión
          </Link>
        </p>
      </main>
    </div>
  );
}

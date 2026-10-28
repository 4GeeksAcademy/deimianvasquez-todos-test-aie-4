"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const signedIn = await login(email, password);
    if (!signedIn) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push("/todos");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-950 text-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="mt-3 text-stone-400">
          Entra para ver tus tareas.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
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
            Entrar
          </button>
        </form>
        <p className="mt-6 text-sm text-stone-400">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-stone-100 underline">
            Regístrate
          </Link>
        </p>
      </main>
    </div>
  );
}

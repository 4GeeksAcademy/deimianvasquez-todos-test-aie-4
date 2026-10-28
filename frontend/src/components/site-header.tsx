"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

export function SiteHeader() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();

  async function onLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-stone-800 bg-stone-900">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Deimiantask
        </Link>
        <div className="flex items-center gap-3">
          {ready && user?.role === "admin" ? (
            <Link href="/users" className="px-2 text-sm font-medium text-stone-300">
              Usuarios
            </Link>
          ) : null}
          <Link
            href="/todos"
            className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-950"
          >
            Tareas
          </Link>
          {ready && user ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-stone-600 px-4 py-2 text-sm font-medium text-stone-100"
            >
              Cerrar sesión
            </button>
          ) : null}
          {ready && !user ? (
            <Link
              href="/login"
              className="rounded-full border border-stone-600 px-4 py-2 text-sm font-medium text-stone-100"
            >
              Iniciar sesión
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

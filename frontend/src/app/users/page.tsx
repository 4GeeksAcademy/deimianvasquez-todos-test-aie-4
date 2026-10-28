"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/context/auth-context";
import { hasAccount } from "@/lib/account";
import { api } from "@/lib/api";

type ListedUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
};

export default function UsersPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [users, setUsers] = useState<ListedUser[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user) {
      router.replace(hasAccount() ? "/login" : "/register");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/todos");
      return;
    }

    let active = true;

    api("/users")
      .then(async (response) => {
        if (!active) {
          return;
        }
        if (response.status === 403) {
          router.replace("/todos");
          return;
        }
        if (!response.ok) {
          setError("No se pudieron cargar los usuarios.");
          return;
        }
        setUsers(await response.json());
      })
      .catch(() => {
        if (active) {
          setError("No se pudo conectar con el servidor.");
        }
      });

    return () => {
      active = false;
    };
  }, [ready, router, user]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-950 text-stone-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-3 text-stone-400">Personas registradas en Deimiantask.</p>
        {error ? <p className="mt-6 text-stone-400">{error}</p> : null}
        {users === null && !error ? (
          <p className="mt-6 text-stone-400">Comprobando sesión...</p>
        ) : null}
        {users?.length === 0 ? (
          <p className="mt-6 text-stone-400">Todavía no hay usuarios.</p>
        ) : null}
        {users && users.length > 0 ? (
          <ul className="mt-8 divide-y divide-stone-800 rounded-2xl border border-stone-800">
            {users.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-stone-400">{person.email}</p>
                </div>
                <span className="shrink-0 rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-300">
                  {person.role === "admin" ? "Admin" : "Usuario"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}

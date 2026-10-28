import { SiteHeader } from "@/components/site-header";

export default function Home() {
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

      <footer className="border-t border-stone-800 bg-stone-900">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-sm text-stone-400">
          <p>Deimiantask</p>
          <p>Lista de tareas</p>
        </div>
      </footer>
    </div>
  );
}

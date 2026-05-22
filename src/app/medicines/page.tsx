import Link from "next/link";
import dynamic from "next/dynamic";

const MedicineForm = dynamic(() => import("@/components/ui/MedicineForm"), { ssr: false });

export default function MedicinesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/30">
          <div>
            <h1 className="text-3xl font-semibold">İlaç Listesi</h1>
            <p className="mt-2 text-slate-300">İlaç ekleme ve düzenleme işlevleri burada başlatılacak.</p>
          </div>
          <Link href="/" className="rounded-2xl bg-slate-800 px-4 py-3 text-sm transition hover:bg-slate-700">
            Ana sayfaya dön
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">Yeni ilaç ekle</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-1">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
              <MedicineForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

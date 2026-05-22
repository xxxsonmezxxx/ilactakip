import Link from "next/link";
import { MedicineCard } from "@/components/ui/MedicineCard";

const medicines = [
  { name: "Parol 500mg", schedule: "09:00, 21:00", note: "Tok karnına alın" },
  { name: "Vitamin D", schedule: "08:00", note: "Aç karnına" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/30">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Leoparlı İlaç Takibi</p>
            <h1 className="mt-3 text-4xl font-semibold">Günlük ilaçlarını takip et</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Saat bazlı alarm, aç/tok uyarısı ve "içmedin" hatırlatmaları için hazırlanan başlangıç proje.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/medicines" className="rounded-2xl bg-emerald-500 px-4 py-4 text-center font-semibold text-slate-950 transition hover:bg-emerald-400">
              İlaçlar
            </Link>
            <Link href="/reports" className="rounded-2xl bg-slate-800 px-4 py-4 text-center transition hover:bg-slate-700">
              Raporlar
            </Link>
            <Link href="/settings" className="rounded-2xl bg-slate-800 px-4 py-4 text-center transition hover:bg-slate-700">
              Ayarlar
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          {medicines.map((medicine) => (
            <MedicineCard key={medicine.name} medicine={medicine} />
          ))}
        </section>
      </div>
    </main>
  );
}

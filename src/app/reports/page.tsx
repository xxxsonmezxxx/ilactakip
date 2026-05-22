import Link from "next/link";

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/30">
          <div>
            <h1 className="text-3xl font-semibold">Raporlar</h1>
            <p className="mt-2 text-slate-300">Günlük uyum oranı ve kaçırılan dozlar buradan takip edilecek.</p>
          </div>
          <Link href="/" className="rounded-2xl bg-slate-800 px-4 py-3 text-sm transition hover:bg-slate-700">
            Ana sayfaya dön
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <p className="text-slate-300">Bu alanda günlük ilaç raporu ve istatistik bileşenleri bulunacak.</p>
        </section>
      </div>
    </main>
  );
}

type Medicine = {
  name: string;
  schedule: string;
  note: string;
};

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  return (
    <article className="rounded-3xl border border-slate-700 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-400">İlaç</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{medicine.name}</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-2 text-sm text-slate-300">{medicine.schedule}</span>
      </div>
      <p className="mt-4 text-slate-300">{medicine.note}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">İçildi</button>
        <button className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400">Hatırlatmayı Ertele</button>
      </div>
    </article>
  );
}

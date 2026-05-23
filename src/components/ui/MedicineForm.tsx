"use client";

import { useState } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function MedicineForm() {
  const [name, setName] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const [note, setNote] = useState("");
  const [foodInstruction, setFoodInstruction] = useState<"Aç" | "Tok" | "Herhangi">("Herhangi");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!db) {
      setError("Bulut bağlantısı yok. Firebase ayarlarını kontrol et.");
      setStatus("error");
      return;
    }

    if (!name.trim()) {
      setError("İlaç adı gereklidir.");
      return;
    }

    const schedule = scheduleText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setStatus("saving");
    try {
      await addDoc(collection(db, "medicines"), {
        name: name.trim(),
        schedule,
        note: note.trim(),
        foodInstruction,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      setName("");
      setScheduleText("");
      setNote("");
      setFoodInstruction("Herhangi");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      console.error(err);
      setError("Kaydetme sırasında hata oluştu.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <div>
        <label className="block text-sm text-slate-300">İlaç adı</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-slate-100" />
      </div>

      <div>
        <label className="block text-sm text-slate-300">Saatler (virgülle ayır, örn: 08:00, 20:00)</label>
        <input value={scheduleText} onChange={(e) => setScheduleText(e.target.value)} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-slate-100" />
      </div>

      <div>
        <label className="block text-sm text-slate-300">Not</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-slate-100" />
      </div>

      <div>
        <label className="block text-sm text-slate-300">Açlık/Tok</label>
        <select value={foodInstruction} onChange={(e) => setFoodInstruction(e.target.value as any)} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-slate-100">
          <option value="Herhangi">Herhangi</option>
          <option value="Aç">Aç</option>
          <option value="Tok">Tok</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === "saving"} className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
          {status === "saving" ? "Kaydediliyor..." : "İlaç Ekle"}
        </button>
        {status === "success" && <span className="text-sm text-emerald-400">Kaydedildi</span>}
        {status === "error" && <span className="text-sm text-rose-400">Hata</span>}
      </div>

      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
    </form>
  );
}

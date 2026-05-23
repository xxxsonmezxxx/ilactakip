'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp, FoodInstruction, ReminderType, DayKey, PILL_COLOR_LIST, RepeatRule } from '../../AppContext';

const ALL_DAYS: DayKey[] = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const ALL_REMINDER_TYPES: ReminderType[] = ['Alarm', 'Bildirim', 'İkisi de'];

const PILL_LABELS: Record<string, string> = {
  'pill-red': '🔴',
  'pill-blue': '🔵',
  'pill-green': '🟢',
  'pill-amber': '🟡',
  'pill-purple': '🟣',
  'pill-teal': '🟦',
  'pill-pink': '🩷',
  'pill-indigo': '🔷',
  'pill-orange': '🟠',
  'pill-cyan': '🩵',
};

const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: 'manual', label: 'Manuel Saat Seçimi' },
  { value: 'q24h', label: 'Yirmidört saatte bir' },
  { value: 'q12h', label: 'Oniki saatte bir' },
  { value: 'q8h', label: 'Sekiz saatte bir' },
  { value: 'q6h', label: 'Altı saatte bir' },
  { value: 'q4h', label: 'Dört saatte bir' },
  { value: 'q3h', label: 'Üç saatte bir' },
  { value: 'q2h', label: 'İki saatte bir' },
  { value: 'q1h', label: 'Her saat başı' },
  { value: 'every2days', label: 'İki günde bir' },
  { value: 'weekly1', label: 'Haftada bir' },
  { value: 'weekly2', label: 'Haftada iki' },
  { value: 'monthly1', label: 'Ayda bir' },
];

const INTERVAL_MAP: Partial<Record<RepeatRule, number>> = {
  q24h: 24,
  q12h: 12,
  q8h: 8,
  q6h: 6,
  q4h: 4,
  q3h: 3,
  q2h: 2,
  q1h: 1,
};

function addHours(time: string, hours: number) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + hours);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function autoSchedule(firstDose: string, rule: RepeatRule) {
  const interval = INTERVAL_MAP[rule];
  if (!interval) return [firstDose];
  const count = Math.max(1, Math.floor(24 / interval));
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(addHours(firstDose, i * interval));
  return Array.from(new Set(out)).sort((a, b) => a.localeCompare(b));
}

function AddMedicineForm() {
  const { user, addMedicine, updateMedicine, medicines } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const editMed = editId ? medicines.find((m) => m.id === editId) : null;

  const [name, setName] = useState(editMed?.name ?? '');
  const [description, setDescription] = useState(editMed?.description ?? '');
  const [dosage, setDosage] = useState(editMed?.dosage ?? '');
  const [foodInstruction, setFoodInstruction] = useState<FoodInstruction>(editMed?.foodInstruction ?? 'Farketmez');
  const [firstDoseTime, setFirstDoseTime] = useState(editMed?.firstDoseTime ?? '08:00');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(editMed?.repeatRule ?? 'manual');
  const [times, setTimes] = useState<string[]>(editMed?.schedule ?? ['08:00']);
  const [days, setDays] = useState<DayKey[]>(editMed?.days ?? [...ALL_DAYS]);
  const [anchorDate, setAnchorDate] = useState((editMed?.anchorDate ?? new Date().toISOString().split('T')[0]));
  const [reminderType, setReminderType] = useState<ReminderType>(editMed?.reminderType ?? 'Bildirim');
  const [reminder, setReminder] = useState(editMed?.reminder ?? true);
  const [color, setColor] = useState(editMed?.color ?? 'pill-amber');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    if (repeatRule === 'manual') return;
    setTimes(autoSchedule(firstDoseTime, repeatRule));
  }, [firstDoseTime, repeatRule]);

  const resolvedDays = useMemo(() => {
    if (repeatRule === 'weekly1' || repeatRule === 'weekly2') {
      const d = new Date(`${anchorDate}T00:00:00`);
      const map: DayKey[] = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      const first = map[d.getDay()];
      if (repeatRule === 'weekly1') return [first];
      const d2 = new Date(d);
      d2.setDate(d2.getDate() + 3);
      const second = map[d2.getDay()];
      return Array.from(new Set([first, second])) as DayKey[];
    }
    if (repeatRule === 'every2days' || repeatRule === 'monthly1') return [...ALL_DAYS];
    return days;
  }, [repeatRule, anchorDate, days]);

  function toggleDay(day: DayKey) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function addTime() {
    const t = newTime.trim();
    if (!t) return;
    if (!times.includes(t)) setTimes((prev) => [...prev, t].sort((a, b) => a.localeCompare(b)));
    setNewTime('');
  }

  function removeTime(t: string) {
    setTimes((prev) => prev.filter((x) => x !== t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('İlaç adı gerekli'); return; }
    if (times.length === 0) { setError('En az bir saat gerekli'); return; }
    if (resolvedDays.length === 0) { setError('En az bir gün seçin'); return; }

    setSaving(true);

    if (reminder && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    const medData = {
      name: name.trim(),
      description: description.trim(),
      dosage: dosage.trim() || undefined,
      schedule: times,
      foodInstruction,
      days: resolvedDays,
      reminderType,
      reminder,
      color,
      repeatRule,
      anchorDate,
      firstDoseTime,
    };

    if (editMed) updateMedicine(editMed.id, medData);
    else addMedicine(medData as any);

    setTimeout(() => router.push('/ilaclarim'), 300);
  }

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '40px' }}>
      <div className="page-header">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '22px', cursor: 'pointer', padding: '4px 8px 4px 0' }}>‹</button>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>{editMed ? 'İlaç Düzenle' : 'Yeni İlaç Ekle'}</h1>
        <button onClick={handleSubmit as any} className="btn-amber" disabled={saving} style={{ padding: '8px 18px', fontSize: '14px' }}>{saving ? '...' : 'Kaydet'}</button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">İlaç Rengi</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {PILL_COLOR_LIST.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '44px', height: '44px', borderRadius: '50%', border: color === c ? '3px solid var(--amber-light)' : '3px solid transparent', background: 'none', cursor: 'pointer', fontSize: '24px' }}>
                {PILL_LABELS[c] ?? '💊'}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">İlaç Adı *</label>
            <input type="text" className="input-field" placeholder="Örn: Amlodipin 5mg" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Dozaj</label>
            <input type="text" className="input-field" placeholder="Örn: 1 kapsül" value={dosage} onChange={(e) => setDosage(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Açıklama</label>
            <input type="text" className="input-field" placeholder="Örn: Tansiyon ilacı" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">Kullanım Sıklığı</label>
          <select className="input-field" value={repeatRule} onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}>
            {REPEAT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <div style={{ marginTop: '12px' }}>
            <label className="input-label">İlk Doz Saati</label>
            <input type="time" className="input-field" value={firstDoseTime} onChange={(e) => setFirstDoseTime(e.target.value)} />
          </div>

          <div style={{ marginTop: '12px' }}>
            <label className="input-label">Başlangıç Tarihi</label>
            <input type="date" className="input-field" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">Kullanım Saatleri</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px', marginBottom: '12px' }}>
            {times.map((t) => (
              <div key={t} className="time-chip">🕐 {t}
                {repeatRule === 'manual' && (
                  <button type="button" onClick={() => removeTime(t)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '0 0 0 4px' }}>✕</button>
                )}
              </div>
            ))}
          </div>
          {repeatRule === 'manual' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="time" className="input-field" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ flex: 1 }} />
              <button type="button" onClick={addTime} className="btn-amber" style={{ padding: '12px 16px', fontSize: '18px' }}>+</button>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">Tekrar Günleri</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            {ALL_DAYS.map((d) => (
              <button key={d} type="button" onClick={() => toggleDay(d)} className={`day-chip ${resolvedDays.includes(d) ? 'active' : ''}`} disabled={repeatRule !== 'manual'}>
                {d}
              </button>
            ))}
          </div>
          {repeatRule !== 'manual' && <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Bu kuralda günler otomatik yönetilir.</p>}
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">Kullanım Şekli</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {([
              ['Aç', '🌤️ Aç karnına'],
              ['Tok', '🍽️ Tok karnına'],
              ['Farketmez', '⚡ Farketmez'],
            ] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => setFoodInstruction(val as FoodInstruction)} className={`food-chip ${foodInstruction === val ? 'active' : ''}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <label className="input-label" style={{ margin: 0 }}>Hatırlatıcı</label>
            <label className="toggle-wrapper">
              <input type="checkbox" className="toggle-input" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
              <span className="toggle-track" />
            </label>
          </div>

          {reminder && (
            <div>
              <label className="input-label">Hatırlatma Türü</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {ALL_REMINDER_TYPES.map((rt) => (
                  <button key={rt} type="button" onClick={() => setReminderType(rt)} className={`food-chip ${reminderType === rt ? 'active' : ''}`} style={{ fontSize: '12px' }}>
                    {rt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#F87171' }}>⚠️ {error}</div>}

        <button type="submit" className="btn-amber" disabled={saving} style={{ padding: '16px', fontSize: '16px' }}>
          {saving ? 'Kaydediliyor...' : editMed ? 'Değişiklikleri Kaydet' : 'İlaç Ekle'}
        </button>
      </form>
    </main>
  );
}

export default function AddMedicinePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(217,119,6,0.2)', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <AddMedicineForm />
    </Suspense>
  );
}

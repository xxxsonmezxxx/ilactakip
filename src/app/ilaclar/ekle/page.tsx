'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp, FoodInstruction, ReminderType, DayKey, PILL_COLOR_LIST } from '../../AppContext';

const ALL_DAYS: DayKey[] = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const ALL_REMINDER_TYPES: ReminderType[] = ['Alarm', 'Bildirim', 'İkisi de'];

const PILL_LABELS: Record<string, string> = {
  'pill-red': 'ğŸ”´',
  'pill-blue': 'ğŸ”µ',
  'pill-green': 'ğŸŸ¢',
  'pill-amber': 'ğŸŸ¡',
  'pill-purple': 'ğŸŸ£',
  'pill-teal': 'ğŸ©µ',
    'pill-indigo': '🔵',
  'pill-orange': '🟠',
  'pill-cyan': '🩵',
};

function AddMedicineForm() {
  const { user, addMedicine, updateMedicine, medicines } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const editMed = editId ? medicines.find(m => m.id === editId) : null;

  const [name, setName] = useState(editMed?.name ?? '');
  const [description, setDescription] = useState(editMed?.description ?? '');
  const [dosage, setDosage] = useState(editMed?.dosage ?? '');
  const [foodInstruction, setFoodInstruction] = useState<FoodInstruction>(editMed?.foodInstruction ?? 'Farketmez');
  const [times, setTimes] = useState<string[]>(editMed?.schedule ?? ['08:00']);
  const [days, setDays] = useState<DayKey[]>(editMed?.days ?? [...ALL_DAYS]);
  const [reminderType, setReminderType] = useState<ReminderType>(editMed?.reminderType ?? 'Bildirim');
  const [reminder, setReminder] = useState(editMed?.reminder ?? true);
  const [color, setColor] = useState(editMed?.color ?? 'pill-amber');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  function toggleDay(day: DayKey) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  function addTime() {
    const t = newTime.trim();
    if (!t) return;
    if (!times.includes(t)) setTimes(prev => [...prev, t].sort());
    setNewTime('');
  }

  function removeTime(t: string) {
    setTimes(prev => prev.filter(x => x !== t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('İlaç adÄ± gerekli'); return; }
    if (times.length === 0) { setError('En az bir saat ekleyin'); return; }
    if (days.length === 0) { setError('En az bir gÃ¼n seÃ§in'); return; }

    setSaving(true);

    // Schedule web notifications for each time
    if (reminder && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    const medData = {
      name: name.trim(),
      description: description.trim(),
      dosage: dosage.trim() || undefined,
      schedule: times,
      foodInstruction,
      days,
      reminderType,
      reminder,
      color,
    };

    if (editMed) {
      updateMedicine(editMed.id, medData);
    } else {
      addMedicine(medData);
      // Schedule notifications via service worker if supported
      scheduleNotifications(name.trim(), times, reminder, reminderType, foodInstruction);
    }

    setTimeout(() => {
      router.push('/ilaclarim');
    }, 400);
  }

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '22px', cursor: 'pointer', padding: '4px 8px 4px 0' }}>â€¹</button>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>
          {editMed ? 'âœï¸ İlaç DÃ¼zenle' : '+ Yeni İlaç Ekle'}
        </h1>
        <button
          id="save-medicine-btn"
          onClick={handleSubmit as any}
          className="btn-amber"
          disabled={saving}
          style={{ padding: '8px 18px', fontSize: '14px' }}
        >
          {saving ? '...' : 'âœ“ Kaydet'}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Color picker */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">ğŸ¨ İlaç Rengi</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {PILL_COLOR_LIST.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{
                width: '44px', height: '44px', borderRadius: '50%', border: color === c ? '3px solid var(--amber-light)' : '3px solid transparent',
                background: 'none', cursor: 'pointer', fontSize: '24px',
                boxShadow: color === c ? '0 0 0 2px rgba(217,119,6,0.5)' : 'none',
                transition: 'all 0.2s',
              }}>
                {PILL_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label">ğŸ’Š İlaç AdÄ± *</label>
            <input
              id="medicine-name"
              type="text"
              className="input-field"
              placeholder="Ã–rn: Amlodipin 5mg"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">âš–ï¸ Dozaj</label>
            <input
              id="medicine-dosage"
              type="text"
              className="input-field"
              placeholder="Ã–rn: 1 KapsÃ¼l, 250ml, YarÄ±m Tablet"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">ğŸ“ AçÄ±klama (isteÄŸe bağlı)</label>
            <input
              id="medicine-desc"
              type="text"
              className="input-field"
              placeholder="Ã–rn: Tansiyon ilacÄ±"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Food Instruction */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">ğŸ½ï¸ KullanÄ±m Åekli</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {([
              ['Aç', 'ğŸŒ…', 'Aç karnÄ±na'],
              ['Tok', 'ğŸ½ï¸', 'Tok karnÄ±na'],
              ['Farketmez', 'âš¡', 'Belirtilmedi'],
            ] as const).map(([val, icon, label]) => (
              <button
                key={val}
                type="button"
                id={`food-${val}`}
                onClick={() => setFoodInstruction(val as FoodInstruction)}
                className={`food-chip ${foodInstruction === val ? 'active' : ''}`}
              >
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Times */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">ğŸ• KullanÄ±m Saatleri</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px', marginBottom: '12px' }}>
            {times.map(t => (
              <div key={t} className="time-chip">
                ğŸ• {t}
                <button type="button" onClick={() => removeTime(t)} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '0 0 0 4px',
                }}>âœ•</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="medicine-time-input"
              type="time"
              className="input-field"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" id="add-time-btn" onClick={addTime} className="btn-amber" style={{ padding: '12px 16px', fontSize: '18px' }}>+</button>
          </div>
        </div>

        {/* Days */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <label className="input-label">ğŸ“… Tekrar Günleri</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            {ALL_DAYS.map(d => (
              <button
                key={d}
                type="button"
                id={`day-${d}`}
                onClick={() => toggleDay(d)}
                className={`day-chip ${days.includes(d) ? 'active' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setDays([...ALL_DAYS])} className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12px' }}>
              Hergün
            </button>
            <button type="button" onClick={() => setDays(['Pzt', 'Sal', 'Çar', 'Per', 'Cum'])} className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12px' }}>
              Hafta içi
            </button>
            <button type="button" onClick={() => setDays(['Cmt', 'Paz'])} className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12px' }}>
              Hafta sonu
            </button>
          </div>
        </div>

        {/* Reminder */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <label className="input-label" style={{ margin: 0 }}>ğŸ”” HatÄ±rlatÄ±cÄ±</label>
            <label className="toggle-wrapper">
              <input
                id="reminder-toggle"
                type="checkbox"
                className="toggle-input"
                checked={reminder}
                onChange={e => setReminder(e.target.checked)}
              />
              <span className="toggle-track" />
            </label>
          </div>

          {reminder && (
            <div>
              <label className="input-label">HatÄ±rlatma TÃ¼rÃ¼</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {ALL_REMINDER_TYPES.map(rt => (
                  <button
                    key={rt}
                    type="button"
                    id={`reminder-${rt}`}
                    onClick={() => setReminderType(rt)}
                    className={`food-chip ${reminderType === rt ? 'active' : ''}`}
                    style={{ fontSize: '12px' }}
                  >
                    {rt === 'Alarm' ? 'â°' : rt === 'Bildirim' ? 'ğŸ””' : 'ğŸ””â°'}
                    <span>{rt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#F87171',
          }}>
            âš ï¸ {error}
          </div>
        )}

        <button
          type="submit"
          id="submit-medicine"
          className="btn-amber"
          disabled={saving}
          style={{ padding: '16px', fontSize: '16px' }}
        >
          {saving ? 'â³ Kaydediliyor...' : editMed ? 'âœ“ Değişiklikleri Kaydet' : '+ İlaç Ekle'}
        </button>
      </form>
    </main>
  );
}

function scheduleNotifications(
  name: string,
  times: string[],
  reminder: boolean,
  reminderType: ReminderType,
  foodInstruction: FoodInstruction
) {
  if (!reminder || typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // Schedule a test notification immediately to confirm
  const foodMsg = foodInstruction === 'Aç' ? 'Aç karnÄ±na alÄ±n.' : foodInstruction === 'Tok' ? 'Tok karnÄ±na alÄ±n.' : '';
  new Notification(`ğŸ’Š ${name}`, {
    body: `İlaç eklendi. ${times.join(', ')} saatlerinde hatÄ±rlatacaÄŸÄ±z. ${foodMsg}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
  });
}

export default function AddMedicinePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(217,119,6,0.2)', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>}>
      <AddMedicineForm />
    </Suspense>
  );
}



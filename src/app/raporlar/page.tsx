'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

type Period = 'gunluk' | 'haftalik' | 'aylik';

function dayKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function RaporlarPage() {
  const { user, dailyLogs, medicines } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Period>('gunluk');
  const [focus, setFocus] = useState<'taken' | 'skipped'>('taken');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) router.replace('/login');
  }, [user, router]);

  const rangeDates = useMemo(() => {
    const today = new Date();
    if (tab === 'aylik') {
      const start = startOfMonth(today);
      const out: string[] = [];
      const d = new Date(start);
      while (d <= today) {
        out.push(dayKey(d));
        d.setDate(d.getDate() + 1);
      }
      return out;
    }

    const days = tab === 'gunluk' ? 1 : 7;
    return Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - i - 1));
      return dayKey(d);
    });
  }, [tab]);

  const periodLogs = useMemo(() => dailyLogs.filter((l) => rangeDates.includes(l.date)), [dailyLogs, rangeDates]);
  const taken = periodLogs.filter((l) => l.status === 'taken').length;
  const skipped = periodLogs.filter((l) => l.status === 'skipped').length;
  const total = periodLogs.length;
  const takenPct = total ? Math.round((taken / total) * 100) : 0;
  const skippedPct = total ? Math.round((skipped / total) * 100) : 0;

  const chartData = useMemo(() => {
    return rangeDates.map((date) => {
      const list = periodLogs.filter((l) => l.date === date);
      const t = list.filter((l) => l.status === 'taken').length;
      const s = list.filter((l) => l.status === 'skipped').length;
      const all = list.length;
      return { date, takenPct: all ? Math.round((t / all) * 100) : 0, skippedPct: all ? Math.round((s / all) * 100) : 0 };
    });
  }, [periodLogs, rangeDates]);

  const selectedDay = selectedDate ?? rangeDates[rangeDates.length - 1] ?? null;
  const selectedDetails = useMemo(() => {
    if (!selectedDay) return [];
    return dailyLogs
      .filter((l) => l.date === selectedDay)
      .sort((a, b) => a.scheduleTime.localeCompare(b.scheduleTime))
      .map((l) => ({
        ...l,
        medicineName: medicines.find((m) => m.id === l.medicineId)?.name ?? 'Bilinmeyen İlaç',
      }));
  }, [selectedDay, dailyLogs, medicines]);

  if (!mounted || !user) return null;

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      <div className="page-header">
        <span style={{ fontSize: '22px' }}>📊</span>
        <h1 style={{ fontSize: '18px', fontWeight: 800, flex: 1 }}>Raporlar</h1>
      </div>

      <div style={{ padding: '16px 20px 0', display: 'flex', gap: '8px' }}>
        {([
          ['gunluk', 'Günlük'],
          ['haftalik', 'Haftalık'],
          ['aylik', 'Aylık'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn-amber' : 'btn-ghost'} style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setFocus('taken')} style={{ flex: 1, borderRadius: '12px', border: focus === 'taken' ? 'none' : '1px solid var(--border-color)', background: focus === 'taken' ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'transparent', color: focus === 'taken' ? '#fff' : 'var(--text-secondary)', padding: '12px', fontWeight: 700, cursor: 'pointer' }}>
              İçilen %{takenPct} ({taken})
            </button>
            <button onClick={() => setFocus('skipped')} style={{ flex: 1, borderRadius: '12px', border: focus === 'skipped' ? 'none' : '1px solid var(--border-color)', background: focus === 'skipped' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'transparent', color: focus === 'skipped' ? '#fff' : 'var(--text-secondary)', padding: '12px', fontWeight: 700, cursor: 'pointer' }}>
              İçilmeyen %{skippedPct} ({skipped})
            </button>
          </div>

          <div style={{ marginTop: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
            <div style={{ minWidth: `${Math.max(420, rangeDates.length * 24)}px`, height: '180px', display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
              {chartData.map((d) => {
                const val = focus === 'taken' ? d.takenPct : d.skippedPct;
                const bar = Math.max(4, Math.round((val / 100) * 130));
                const isActive = selectedDay === d.date;
                return (
                  <button key={d.date} onClick={() => setSelectedDate(d.date)} style={{ width: '18px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <div style={{ width: '100%', height: `${bar}px`, borderRadius: '8px 8px 4px 4px', background: focus === 'taken' ? 'linear-gradient(180deg,#22C55E,#16A34A)' : 'linear-gradient(180deg,#EF4444,#DC2626)', outline: isActive ? '2px solid var(--amber)' : 'none' }} />
                    <span style={{ fontSize: '10px', color: isActive ? 'var(--amber)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}>{new Date(`${d.date}T00:00:00`).getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Toplam kayıt: {total}</div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px' }}>Seçili Gün Detayı ({selectedDay ?? '-'})</h3>
          {selectedDetails.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Seçili gün için kayıt yok.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedDetails.map((item, i) => (
                <div key={`${item.medicineId}-${item.scheduleTime}-${i}`} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{item.medicineName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.scheduleTime} - {item.status === 'taken' ? 'İçildi' : item.status === 'skipped' ? 'İçilmedi' : item.status === 'snoozed' ? 'Ertelendi' : 'Bekliyor'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

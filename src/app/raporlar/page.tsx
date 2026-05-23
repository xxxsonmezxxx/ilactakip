'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

type Period = 'gunluk' | 'haftalik' | 'aylik';

function dayKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function periodDays(p: Period) {
  if (p === 'gunluk') return 1;
  if (p === 'haftalik') return 7;
  return 30;
}

function shortLabel(date: string, period: Period) {
  const d = new Date(`${date}T00:00:00`);
  if (period === 'aylik') return `${d.getDate()}`;
  return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()];
}

export default function RaporlarPage() {
  const { user, dailyLogs, medicines } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Period>('gunluk');
  const [focus, setFocus] = useState<'taken' | 'skipped'>('taken');

  useEffect(() => {
    setMounted(true);
    if (!user) router.replace('/login');
  }, [user, router]);

  const rangeDates = useMemo(() => {
    const count = periodDays(tab);
    return Array.from({ length: count }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (count - i - 1));
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

  const skippedDetails = useMemo(() => {
    return periodLogs
      .filter((l) => l.status === 'skipped')
      .sort((a, b) => `${b.date} ${b.scheduleTime}`.localeCompare(`${a.date} ${a.scheduleTime}`))
      .map((l) => ({ ...l, medicineName: medicines.find((m) => m.id === l.medicineId)?.name ?? 'Bilinmeyen İlaç' }));
  }, [periodLogs, medicines]);

  if (!mounted || !user) return null;

  const barWidth = tab === 'aylik' ? 16 : 28;

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

          <div style={{ marginTop: '16px', overflowX: tab === 'aylik' ? 'auto' : 'visible', paddingBottom: '6px' }}>
            <div style={{ minWidth: tab === 'aylik' ? '720px' : '100%', height: '180px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              {chartData.map((d) => {
                const val = focus === 'taken' ? d.takenPct : d.skippedPct;
                const bar = Math.max(4, Math.round((val / 100) * 130));
                return (
                  <div key={d.date} style={{ width: `${barWidth}px`, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div title={`${d.date} - %${val}`} style={{ width: '100%', height: `${bar}px`, borderRadius: '8px 8px 4px 4px', background: focus === 'taken' ? 'linear-gradient(180deg,#22C55E,#16A34A)' : 'linear-gradient(180deg,#EF4444,#DC2626)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{shortLabel(d.date, tab)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Toplam kayıt: {total}</div>
        </div>

        {focus === 'skipped' && (
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px' }}>İçilmeyen Detayı ({tab})</h3>
            {skippedDetails.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Bu dönemde içilmeyen ilaç yok.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {skippedDetails.map((item, i) => (
                  <div key={`${item.medicineId}-${item.date}-${item.scheduleTime}-${i}`} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{item.medicineName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.date} - {item.scheduleTime}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

export default function RaporlarPage() {
  const { user, dailyLogs, medicines } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'gunluk' | 'haftalik' | 'aylik'>('gunluk');

  useEffect(() => {
    setMounted(true);
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!mounted || !user) return null;

  const today = new Date().toISOString().split('T')[0];

  // Calculate stats for different periods
  function getStats(days: number) {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const periodLogs = dailyLogs.filter(l => dates.includes(l.date));
    const taken = periodLogs.filter(l => l.status === 'taken').length;
    const skipped = periodLogs.filter(l => l.status === 'skipped').length;
    const total = periodLogs.length;
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
    return { taken, skipped, pending: total - taken - skipped, total, pct };
  }

  const days = tab === 'gunluk' ? 1 : tab === 'haftalik' ? 7 : 30;
  const stats = getStats(days);

  // Weekly bar chart data
  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const logs = dailyLogs.filter(l => l.date === dateStr);
    const taken = logs.filter(l => l.status === 'taken').length;
    const total = logs.length;
    const pct = total > 0 ? (taken / total) * 100 : 0;
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const dayIdx = d.getDay();
    return { day: days[dayIdx === 0 ? 6 : dayIdx - 1], pct, taken, total, isToday: dateStr === today };
  });

  // Medicine-specific stats
  const medStats = medicines.map(m => {
    const logs = dailyLogs.filter(l => l.medicineId === m.id);
    const taken = logs.filter(l => l.status === 'taken').length;
    const total = logs.length;
    return { medicine: m, taken, total, pct: total > 0 ? Math.round((taken / total) * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct);

  const r = 60;
  const circ = 2 * Math.PI * r;
  const dash = (stats.pct / 100) * circ;

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      <div className="page-header">
        <span style={{ fontSize: '22px' }}>📊</span>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>Raporlar</h1>
      </div>

      {/* Period tabs */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: '8px' }}>
        {([['gunluk', 'Günlük'], ['haftalik', 'Haftalık'], ['aylik', 'Aylık']] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600',
            border: tab === t ? 'none' : '1px solid rgba(217,119,6,0.2)',
            background: tab === t ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
            color: tab === t ? '#080808' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Overview card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
            Uyum Oranı
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width="148" height="148" className="progress-ring">
                <circle cx="74" cy="74" r={r} fill="none" stroke="rgba(217,119,6,0.1)" strokeWidth="10" />
                <circle cx="74" cy="74" r={r} fill="none"
                  stroke={stats.pct >= 80 ? '#22C55E' : stats.pct >= 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ}`}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: stats.pct >= 80 ? 'var(--success)' : stats.pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>%{stats.pct}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Uyum Oranı</span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                ['İçilen', stats.taken, 'var(--success)', '✓'],
                ['Atlanan', stats.skipped, 'var(--danger)', '✕'],
                ['Toplam', stats.total, 'var(--text-secondary)', '∑'],
              ].map(([label, val, color, icon]) => (
                <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: `${color}20`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '13px', color: color as string,
                  }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: color as string, lineHeight: 1.1 }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '20px' }}>📈 Haftalık Özet</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
            {weekData.map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '100%', height: `${Math.max(d.pct, 4)}px`, maxHeight: '80px',
                  minHeight: '4px',
                  borderRadius: '6px 6px 3px 3px',
                  background: d.pct >= 80 ? 'linear-gradient(180deg, #22C55E, #16A34A)' :
                    d.pct >= 50 ? 'linear-gradient(180deg, #F59E0B, #D97706)' :
                    d.isToday ? 'rgba(217,119,6,0.2)' :
                    d.total === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg, #EF4444, #DC2626)',
                  transition: 'height 0.6s ease',
                }} />
                <span style={{ fontSize: '10px', color: d.isToday ? 'var(--amber-light)' : 'var(--text-muted)', fontWeight: d.isToday ? '700' : '400' }}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-medicine stats */}
        {medStats.length > 0 && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>💊 İlaç Bazlı İstatistik</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {medStats.map(({ medicine, taken, total, pct }) => (
                <div key={medicine.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={medicine.color} style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                      }}>💊</div>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{medicine.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      %{pct}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: '3px', transition: 'width 0.8s ease',
                      background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {taken} alındı / {total} toplam
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

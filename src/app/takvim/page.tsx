'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TURKISH_DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function getMonday(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, adjust to Mon=0
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function TakvimPage() {
  const { user, dailyLogs, medicines } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);

  useEffect(() => {
    setMounted(true);
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!mounted || !user) return null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = now.toISOString().split('T')[0];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function getDateLogs(dateStr: string) {
    return dailyLogs.filter(l => l.date === dateStr);
  }

  function getDayStatus(dateStr: string): 'taken' | 'partial' | 'missed' | 'future' | 'none' {
    if (dateStr > today) return 'future';
    const logs = getDateLogs(dateStr);
    if (logs.length === 0) return 'none';
    const taken = logs.filter(l => l.status === 'taken').length;
    const total = logs.length;
    if (taken === total) return 'taken';
    if (taken > 0) return 'partial';
    return 'missed';
  }

  const selectedLogs = getDateLogs(selectedDate);
  const selectedMeds = selectedLogs.map(l => ({
    log: l,
    medicine: medicines.find(m => m.id === l.medicineId),
  })).filter(x => x.medicine);

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      <div className="page-header">
        <span style={{ fontSize: '22px' }}>📅</span>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>Takvim</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Month Navigator */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--amber-light)', fontSize: '22px', cursor: 'pointer', padding: '8px' }}>‹</button>
            <h2 style={{ fontSize: '17px', fontWeight: '700' }}>
              {TURKISH_MONTHS[viewMonth]} {viewYear}
            </h2>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--amber-light)', fontSize: '22px', cursor: 'pointer', padding: '8px' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {TURKISH_DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = getDayStatus(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              let dotColor = 'transparent';
              if (status === 'taken') dotColor = 'var(--success)';
              else if (status === 'partial') dotColor = 'var(--warning)';
              else if (status === 'missed') dotColor = 'var(--danger)';

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    aspectRatio: '1', borderRadius: '10px', fontSize: '13px', fontWeight: isToday ? '800' : '500',
                    border: isToday ? '2px solid var(--amber)' : isSelected ? '2px solid rgba(217,119,6,0.5)' : 'none',
                    background: isSelected ? 'rgba(217,119,6,0.15)' : 'transparent',
                    color: isToday ? 'var(--amber-light)' : 'var(--text-primary)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '2px',
                    transition: 'all 0.15s', position: 'relative',
                  }}
                >
                  {day}
                  {dotColor !== 'transparent' && (
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(217,119,6,0.1)', flexWrap: 'wrap' }}>
            {[['var(--success)', 'Tümü Alındı'], ['var(--warning)', 'Kısmen'], ['var(--danger)', 'Atlandı']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Selected day detail */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>
            📋 {selectedDate === today ? 'Bugün' : selectedDate} — {selectedMeds.length} kayıt
          </h3>

          {selectedMeds.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              Bu gün için ilaç kaydı yok
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedMeds.map(({ log, medicine }) => (
                <div key={`${log.medicineId}-${log.scheduleTime}`} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', background: 'rgba(217,119,6,0.05)', borderRadius: '12px',
                  border: '1px solid rgba(217,119,6,0.1)',
                }}>
                  <div className={medicine!.color} style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                  }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{medicine!.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{log.scheduleTime}</div>
                  </div>
                  {log.status === 'taken' && <span className="badge-alindi">✓ Alındı</span>}
                  {log.status === 'skipped' && <span className="badge-atlandi">✕ Atlandı</span>}
                  {log.status === 'pending' && <span style={{ fontSize: '12px', color: 'var(--warning)' }}>⏳</span>}
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

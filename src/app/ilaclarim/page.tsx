'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, MedicineRecord } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

const DAY_KEYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function getDateStr() {
  const d = new Date();
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getFoodBadge(fi: string) {
  if (fi === 'Aç') return <span className="badge-ac">🌅 Aç karnına</span>;
  if (fi === 'Tok') return <span className="badge-tok">🍽️ Tok karnına</span>;
  return <span className="badge-any">⚡ Farketmez</span>;
}

function getStatusBadge(status: string) {
  if (status === 'taken') return <span className="badge-alindi">✓ Alındı</span>;
  if (status === 'skipped') return <span className="badge-atlandi">✕ Atlandı</span>;
  return <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '600' }}>⏳ Bekliyor</span>;
}

export default function IlaclarimPage() {
  const { user, medicines, deleteMedicine, getTodayLogs, markTaken, markSkipped, markSnoozed } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'bugun' | 'tumü'>('bugun');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!mounted || !user) return null;

  const today = new Date().toISOString().split('T')[0];
  const logs = getTodayLogs();

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-header">
        <span style={{ fontSize: '22px' }}>💊</span>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>İlaçlarım</h1>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{getDateStr()}</span>
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: '8px' }}>
        {([['bugun', '📋 Bugün'], ['tumü', '💊 Tüm İlaçlar']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
              border: activeTab === tab ? 'none' : '1px solid rgba(217,119,6,0.2)',
              background: activeTab === tab ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
              color: activeTab === tab ? '#080808' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTab === 'bugun' ? (
          logs.filter(l => l.status !== 'taken').length === 0 ? (
            <EmptyState />
          ) : (
            logs.filter(l => l.status !== 'taken').map((log, i) => (
              <div key={`${log.medicine.id}-${log.time}`} className="glass-card animate-fade-in-up" style={{
                padding: '16px', animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: 'forwards',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={log.medicine.color} style={{
                    width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                    💊
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
                      {log.medicine.name}
                      {log.medicine.dosage && <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--amber-light)', marginLeft: '6px' }}>({log.medicine.dosage})</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', color: 'var(--amber-light)', fontSize: '14px' }}>{log.time}</span>
                      {getFoodBadge(log.medicine.foodInstruction)}
                    </div>
                  </div>
                  <div>{getStatusBadge(log.status)}</div>
                </div>
                {log.medicine.description && (
                  <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '58px' }}>
                    {log.medicine.description}
                  </p>
                )}
                {log.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => markTaken(log.medicine.id, log.time, today)} className="btn-amber" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                      ✓ İçtim
                    </button>
                    <button onClick={() => markSkipped(log.medicine.id, log.time, today)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                      ✕ Atla
                    </button>
                    <button onClick={() => markSnoozed(log.medicine.id, log.time, today)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                      💤 Ertele
                    </button>
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          medicines.length === 0 ? (
            <EmptyState />
          ) : (
            medicines.map((med, i) => (
              <MedicineCard key={med.id} med={med} index={i}
                onDelete={() => setConfirmDelete(med.id)}
              />
            ))
          )
        )}

        <Link href="/ilaclar/ekle" style={{ textDecoration: 'none' }}>
          <button id="btn-add-medicine" className="btn-amber" style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '4px' }}>
            + Yeni İlaç Ekle
          </button>
        </Link>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="glass-card" style={{ padding: '28px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🗑️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>İlacı Sil</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Bu ilacı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost" style={{ flex: 1, padding: '12px' }}>İptal</button>
              <button onClick={() => { deleteMedicine(confirmDelete); setConfirmDelete(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#F87171', fontWeight: '600', cursor: 'pointer' }}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function MedicineCard({ med, index, onDelete }: { med: MedicineRecord; index: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-card animate-fade-in-up" style={{
      padding: '16px', animationDelay: `${index * 0.05}s`, opacity: 0, animationFillMode: 'forwards',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div className={med.color} style={{
          width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
        }}>💊</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>
            {med.name}
            {med.dosage && <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--amber-light)', marginLeft: '6px' }}>({med.dosage})</span>}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {med.schedule.join(' · ')} · {med.days.join(', ')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>⌄</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(217,119,6,0.1)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {med.schedule.map(t => (
              <div key={t} className="time-chip"><span>🕐</span>{t}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Kullanım:</span>
            {med.days.map(d => (
              <span key={d} className="day-chip active" style={{ width: 'auto', borderRadius: '8px', padding: '2px 10px', height: 'auto', fontSize: '12px' }}>{d}</span>
            ))}
          </div>
          <div style={{ marginBottom: '12px' }}>
            {med.foodInstruction === 'Aç' && <span className="badge-ac">🌅 Aç karnına</span>}
            {med.foodInstruction === 'Tok' && <span className="badge-tok">🍽️ Tok karnına</span>}
            {med.foodInstruction === 'Farketmez' && <span className="badge-any">⚡ Farketmez</span>}
            {med.reminder && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--amber)' }}>🔔 {med.reminderType}</span>}
          </div>
          {med.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{med.description}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/ilaclar/ekle?edit=${med.id}`} style={{ flex: 1, textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ width: '100%', padding: '10px', fontSize: '13px' }}>✏️ Düzenle</button>
            </Link>
            <button onClick={onDelete} style={{
              flex: 1, padding: '10px', fontSize: '13px', borderRadius: '14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#F87171', cursor: 'pointer', fontWeight: '600',
            }}>🗑️ Sil</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>İlaç bulunamadı</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Yeni bir ilaç eklemek için aşağıdaki butonu kullanın.</p>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

export default function AyarlarPage() {
  const { user, logout, medicines, dailyLogs } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [notifPerm, setNotifPerm] = useState<string>('default');

  useEffect(() => {
    setMounted(true);
    if (!user) { router.replace('/login'); return; }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission);
    }
  }, [user, router]);

  if (!mounted || !user) return null;

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  function requestNotifPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => setNotifPerm(p));
    }
  }

  const totalMeds = medicines.length;
  const totalLogs = dailyLogs.length;
  const totalTaken = dailyLogs.filter(l => l.status === 'taken').length;

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      <div className="page-header">
        <span style={{ fontSize: '22px' }}>⚙️</span>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>Ayarlar</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* User Profile Card */}
        <div className="glass-card leopard-border" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', fontWeight: '800', color: '#080808',
              boxShadow: '0 4px 16px rgba(217,119,6,0.4)',
              flexShrink: 0,
            }}>
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{user.name}</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>{user.email}</p>
              <div style={{
                marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(217,119,6,0.1)', padding: '4px 10px', borderRadius: '8px',
              }}>
                <span style={{ fontSize: '14px' }}>🐆</span>
                <span style={{ fontSize: '12px', color: 'var(--amber-light)', fontWeight: '600' }}>L.İ.T Kullanıcısı</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              ['💊', totalMeds, 'İlaç'],
              ['✓', totalTaken, 'Alındı'],
              ['📊', totalLogs, 'Toplam Kayıt'],
            ].map(([icon, val, label]) => (
              <div key={label as string} style={{
                background: 'rgba(217,119,6,0.06)', borderRadius: '12px', padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--amber-light)' }}>{val}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* App Settings */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-muted)' }}>🔔 BİLDİRİM AYARLARI</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(217,119,6,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Bildirim İzni</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {notifPerm === 'granted' ? 'İzin verildi ✓' : notifPerm === 'denied' ? 'Reddedildi' : 'Henüz verilmedi'}
                </div>
              </div>
            </div>
            {notifPerm !== 'granted' && notifPerm !== 'denied' && (
              <button onClick={requestNotifPermission} className="btn-amber" style={{ padding: '8px 14px', fontSize: '12px' }}>
                İzin Ver
              </button>
            )}
            {notifPerm === 'granted' && <span style={{ fontSize: '18px' }}>✅</span>}
            {notifPerm === 'denied' && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Tarayıcı ayarlarından açın</span>}
          </div>
        </div>

        {/* PWA Install */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-muted)' }}>📱 UYGULAMA</h3>

          <div style={{ padding: '12px', background: 'rgba(217,119,6,0.06)', borderRadius: '12px', border: '1px solid rgba(217,119,6,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
              }}>🐆</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Leoparlı İlaç Takibim</div>
                <div style={{ fontSize: '12px', color: 'var(--amber-light)' }}>L.İ.T — Sürüm 1.0.0</div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Safari'de bu siteyi ana ekrana ekleyerek uygulama gibi kullanabilirsiniz. Paylaş butonuna (⬆️) basıp "Ana Ekrana Ekle"yi seçin.
            </p>
          </div>
        </div>

        {/* About */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-muted)' }}>ℹ️ HAKKINDA</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['🌐', 'Domain', 'leoparliilactakibim'],
              ['📱', 'Kısa İsim', 'L.İ.T'],
              ['💾', 'Veri Depolama', 'Yerel (Cihazınızda)'],
              ['🔒', 'Gizlilik', 'Verileriniz yalnızca sizde'],
            ].map(([icon, label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={() => setShowLogout(true)}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: '600',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#F87171', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          🚪 Çıkış Yap
        </button>
      </div>

      {/* Logout confirm */}
      {showLogout && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="glass-card" style={{ padding: '28px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚪</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Çıkış Yap</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Çıkış yapmak istediğinizden emin misiniz?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogout(false)} className="btn-ghost" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>İptal</button>
              <button onClick={handleLogout} style={{
                flex: 1, padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: '600',
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#F87171', cursor: 'pointer',
              }}>Çıkış Yap</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

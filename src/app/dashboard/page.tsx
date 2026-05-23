'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function getDateStr() {
  const d = new Date();
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]}, ${TURKISH_DAYS[d.getDay()]}`;
}

function getFoodBadge(fi: string) {
  if (fi === 'Aç') return <span className="badge-ac">Aç karnına</span>;
  if (fi === 'Tok') return <span className="badge-tok">Tok karnına</span>;
  return <span className="badge-any">Farketmez</span>;
}

function getStatusBadge(status: string) {
  if (status === 'taken') return <span className="badge-alindi">✓ Alındı</span>;
  if (status === 'skipped') return <span className="badge-atlandi">✕ Atlandı</span>;
  if (status === 'snoozed') return <span className="badge-any">Ertelendi</span>;
  return <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bekliyor</span>;
}

export default function DashboardPage() {
  const { user, getTodayLogs, markTaken, markSkipped, markSnoozed } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState('');

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.replace('/login');
      return;
    }
    const tick = () => {
      const d = new Date();
      setNow(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [user, router]);

  if (!mounted || !user) return null;

  const logs = getTodayLogs();
  const total = logs.length;
  const taken = logs.filter((l) => l.status === 'taken').length;
  const skipped = logs.filter((l) => l.status === 'skipped').length;
  const pending = total - taken - skipped;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
  const today = new Date().toISOString().split('T')[0];

  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      <div
        style={{
          background: 'rgba(8,8,8,0.92)',
          borderBottom: '1px solid rgba(217,119,6,0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: 'calc(16px + env(safe-area-inset-top)) 20px 14px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>🐆 Leoparlı İlaç Takibim</p>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '2px', letterSpacing: '0.02em', color: '#fff' }}>
              {user.name.split(' ')[0].toUpperCase()}
            </h1>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--amber-light)' }}>{now}</div>
            <div>{getDateStr()}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="132" height="132" className="progress-ring">
              <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(217,119,6,0.1)" strokeWidth="10" />
              <circle
                cx="66"
                cy="66"
                r={r}
                fill="none"
                stroke="url(#amberGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              <defs>
                <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--amber-light)' }}>%{pct}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Bugünkü ilaçlar</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StatRow icon="✓" label="İçildi" count={taken} color="var(--success)" />
            <StatRow icon="⏳" label="Beklemede" count={pending} color="var(--warning)" />
            <StatRow icon="✕" label="İçilmeyen" count={skipped} color="var(--danger)" />
          </div>
        </div>

        <InstallBanner />
        <NotificationBanner />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Yaklaşan İlaçlar</h2>
            <Link href="/ilaclarim" style={{ fontSize: '13px', color: 'var(--amber)', textDecoration: 'none' }}>
              Tümünü gör →
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💊</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Bugün için ilaç yok.</p>
              <Link href="/ilaclar/ekle">
                <button className="btn-amber" style={{ marginTop: '16px', padding: '10px 24px', fontSize: '14px' }}>
                  + İlaç Ekle
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logs.filter((l) => l.status !== 'taken').map((log, i) => (
                <div
                  key={`${log.medicine.id}-${log.time}`}
                  className="glass-card animate-fade-in-up"
                  style={{ padding: '16px', animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      className={log.medicine.color}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      💊
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.medicine.name}
                          {log.medicine.dosage && (
                            <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--amber-light)', marginLeft: '6px' }}>({log.medicine.dosage})</span>
                          )}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--amber-light)', flexShrink: 0, marginLeft: '8px' }}>{log.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {getFoodBadge(log.medicine.foodInstruction)}
                        {log.medicine.description && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.medicine.description}</span>}
                      </div>
                    </div>
                  </div>

                  {log.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button id={`take-${log.medicine.id}-${log.time}`} onClick={() => markTaken(log.medicine.id, log.time, today)} className="btn-amber" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                        ✓ İçtim
                      </button>
                      <button id={`skip-${log.medicine.id}-${log.time}`} onClick={() => markSkipped(log.medicine.id, log.time, today)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                        ✕ Atla
                      </button>
                      <button id={`snooze-${log.medicine.id}-${log.time}`} onClick={() => markSnoozed(log.medicine.id, log.time, today)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                        Ertele
                      </button>
                    </div>
                  )}

                  {log.status !== 'pending' && <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>{getStatusBadge(log.status)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/ilaclar/ekle">
            <button id="fab-add-medicine" className="btn-amber animate-pulse-amber" style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '28px', lineHeight: 1, boxShadow: '0 8px 24px rgba(217,119,6,0.5)' }}>
              +
            </button>
          </Link>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>İlaç Ekle</p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

function StatRow({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color, lineHeight: 1.2 }}>{count}</div>
      </div>
    </div>
  );
}

function NotificationBanner() {
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') setShow(true);
      if (Notification.permission === 'granted') setGranted(true);
    }
  }, []);

  if (!show || granted) return null;

  function request() {
    Notification.requestPermission().then((p) => {
      setShow(false);
      if (p === 'granted') setGranted(true);
    });
  }

  return (
    <div className="notification-banner" style={{ cursor: 'pointer' }} onClick={request}>
      <span style={{ fontSize: '22px' }}>🔔</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber-light)' }}>Bildirimlere izin ver</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>İlaç saatlerinde hatırlatma alın</div>
      </div>
      <button className="btn-amber" style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>İzin Ver</button>
    </div>
  );
}

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone = (window.navigator as any).standalone;

    if (ios && !standalone) {
      setIsIOS(true);
      setShow(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show) return null;

  if (isIOS) {
    return (
      <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '14px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: showIOSGuide ? '12px' : '0' }}>
          <span style={{ fontSize: '22px' }}>📱</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber-light)' }}>Ana Ekrana Ekle</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uygulama olarak kullan</div>
          </div>
          <button onClick={() => setShowIOSGuide(!showIOSGuide)} className="btn-amber" style={{ padding: '8px 12px', fontSize: '12px' }}>
            Nasıl?
          </button>
          <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>
            ✕
          </button>
        </div>
        {showIOSGuide && (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            1. Safari'de <strong style={{ color: 'var(--amber-light)' }}>Paylaş</strong> butonuna bas
            <br />
            2. <strong style={{ color: 'var(--amber-light)' }}>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine dokun
            <br />
            3. <strong style={{ color: 'var(--amber-light)' }}>&quot;Ekle&quot;</strong> butonuna bas
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '22px' }}>📲</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber-light)' }}>Uygulamayı Yükle</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ana ekrana ekleyip uygulama gibi kullan</div>
      </div>
      <button
        id="btn-install-pwa"
        onClick={() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => setShow(false));
          }
        }}
        className="btn-amber"
        style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
      >
        Yükle
      </button>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>
        ✕
      </button>
    </div>
  );
}

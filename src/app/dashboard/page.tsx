'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../AppContext';
import BottomNav from '@/components/ui/BottomNav';

const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'SalÄ±', 'Ã‡arÅŸamba', 'PerÅŸembe', 'Cuma', 'Cumartesi'];
const TURKISH_MONTHS = ['Ocak', 'Åubat', 'Mart', 'Nisan', 'MayÄ±s', 'Haziran', 'Temmuz', 'AÄŸustos', 'EylÃ¼l', 'Ekim', 'KasÄ±m', 'AralÄ±k'];

function getDateStr() {
  const d = new Date();
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]}, ${TURKISH_DAYS[d.getDay()]}`;
}

function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `GÃ¼naydÄ±n, ${name.split(' ')[0]}! â˜€ï¸`;
  if (h < 18) return `Ä°yi gÃ¼nler, ${name.split(' ')[0]}! ğŸŒ¤ï¸`;
  return `Ä°yi akÅŸamlar, ${name.split(' ')[0]}! ğŸŒ™`;
}

function getFoodBadge(fi: string) {
  if (fi === 'AÃ§') return <span className="badge-ac">AÃ§ karnÄ±na</span>;
  if (fi === 'Tok') return <span className="badge-tok">Tok karnÄ±na</span>;
  return <span className="badge-any">Farketmez</span>;
}

function getStatusBadge(status: string) {
  if (status === 'taken') return <span className="badge-alindi">âœ“ AlÄ±ndÄ±</span>;
  if (status === 'skipped') return <span className="badge-atlandi">âœ• AtlandÄ±</span>;
  if (status === 'snoozed') return <span className="badge-any">ğŸ’¤ Ertelendi</span>;
  return <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bekliyor</span>;
}

const PILL_EMOJIS: Record<string, string> = {
  'pill-red': 'ğŸ”´',
  'pill-blue': 'ğŸ”µ',
  'pill-green': 'ğŸŸ¢',
  'pill-amber': 'ğŸŸ¡',
  'pill-purple': 'ğŸŸ£',
  'pill-teal': 'ğŸ©µ',
  'pill-pink': 'ğŸ©·',
};

export default function DashboardPage() {
  const { user, getTodayLogs, markTaken, markSkipped, markSnoozed, medicines } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState('');

  useEffect(() => {
    setMounted(true);
    if (!user) { router.replace('/login'); return; }
    const tick = () => {
      const d = new Date();
      setNow(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [user, router]);

  if (!mounted || !user) return null;

  const logs = getTodayLogs();
  const total = logs.length;
  const taken = logs.filter(l => l.status === 'taken').length;
  const skipped = logs.filter(l => l.status === 'skipped').length;
  const pending = total - taken - skipped;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  // Next upcoming medicine
  const upcoming = logs.filter(l => l.status === 'pending').slice(0, 3);

  const today = new Date().toISOString().split('T')[0];

  // Circle progress params
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(8,8,8,0.92)', borderBottom: '1px solid rgba(217,119,6,0.15)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        padding: 'calc(16px + env(safe-area-inset-top)) 20px 14px', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              🐆 Leoparlı İlaç Takibim
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '2px', letterSpacing: '0.02em' }}>
              <span style={{ color: '#FFFFFF' }}>{user.name.split(' ')[0].toUpperCase()}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--amber-light)' }}>{now}</div>
              <div>{getDateStr()}</div>
            </div>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: '800', color: '#080808',
              boxShadow: '0 2px 10px rgba(217,119,6,0.4)',
            }}>
              {user.name[0].toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Progress Ring Card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="132" height="132" className="progress-ring">
              <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(217,119,6,0.1)" strokeWidth="10" />
              <circle
                cx="66" cy="66" r={r}
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
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--amber-light)' }}>%{pct}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BugÃ¼nkÃ¼ ilaÃ§lar</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StatRow icon="âœ…" label="Ä°Ã§ildi" count={taken} color="var(--success)" />
            <StatRow icon="â³" label="Beklemede" count={pending} color="var(--warning)" />
            <StatRow icon="âŒ" label="Ä°Ã§ilmeyen" count={skipped} color="var(--danger)" />
          </div>
        </div>

        {/* Install PWA Banner */}
        <InstallBanner />

        {/* Notification Banner */}
        <NotificationBanner />

        {/* Upcoming medicines */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>ğŸ“‹ YaklaÅŸan Ä°laÃ§lar</h2>
            <Link href="/ilaclarim" style={{ fontSize: '13px', color: 'var(--amber)', textDecoration: 'none' }}>
              TÃ¼mÃ¼nÃ¼ gÃ¶r â†’
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>ğŸ’Š</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>BugÃ¼n iÃ§in ilaÃ§ yok.</p>
              <Link href="/ilaclar/ekle">
                <button className="btn-amber" style={{ marginTop: '16px', padding: '10px 24px', fontSize: '14px' }}>
                  + Ä°laÃ§ Ekle
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logs.filter(l => l.status !== 'taken').map((log, i) => (
                <div key={`${log.medicine.id}-${log.time}`} className="glass-card animate-fade-in-up" style={{
                  padding: '16px', animationDelay: `${i * 0.05}s`,
                  opacity: 0, animationFillMode: 'forwards',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className={log.medicine.color} style={{
                      width: '44px', height: '44px', borderRadius: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}>
                      ğŸ’Š
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.medicine.name}
                          {log.medicine.dosage && <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--amber-light)', marginLeft: '6px' }}>({log.medicine.dosage})</span>}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--amber-light)', flexShrink: 0, marginLeft: '8px' }}>{log.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {getFoodBadge(log.medicine.foodInstruction)}
                        {log.medicine.description && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.medicine.description}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {log.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        id={`take-${log.medicine.id}-${log.time}`}
                        onClick={() => markTaken(log.medicine.id, log.time, today)}
                        className="btn-amber"
                        style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                      >
                        âœ“ Ä°Ã§tim
                      </button>
                      <button
                        id={`skip-${log.medicine.id}-${log.time}`}
                        onClick={() => markSkipped(log.medicine.id, log.time, today)}
                        className="btn-ghost"
                        style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                      >
                        âœ• Atla
                      </button>
                      <button
                        id={`snooze-${log.medicine.id}-${log.time}`}
                        onClick={() => markSnoozed(log.medicine.id, log.time, today)}
                        className="btn-ghost"
                        style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                      >
                        ğŸ’¤ Ertele
                      </button>
                    </div>
                  )}

                  {log.status !== 'pending' && (
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                      {getStatusBadge(log.status)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add FAB area */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/ilaclar/ekle">
            <button
              id="fab-add-medicine"
              className="btn-amber animate-pulse-amber"
              style={{
                width: '60px', height: '60px', borderRadius: '50%',
                fontSize: '28px', lineHeight: 1,
                boxShadow: '0 8px 24px rgba(217,119,6,0.5)',
              }}
            >
              +
            </button>
          </Link>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Ä°laÃ§ Ekle</p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

function StatRow({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: `${color}20`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '15px',
      }}>
        {icon}
      </div>
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
    Notification.requestPermission().then(p => {
      setShow(false);
      if (p === 'granted') setGranted(true);
    });
  }

  return (
    <div className="notification-banner" style={{ cursor: 'pointer' }} onClick={request}>
      <span style={{ fontSize: '22px' }}>ğŸ””</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber-light)' }}>Bildirimlere izin ver</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ä°laÃ§ saatlerinde hatÄ±rlatma alÄ±n</div>
      </div>
      <button className="btn-amber" style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>
        Ä°zin Ver
      </button>
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
      <div style={{
        background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)',
        borderRadius: '14px', padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: showIOSGuide ? '12px' : '0' }}>
          <span style={{ fontSize: '22px' }}>ğŸ“±</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber-light)' }}>Ana Ekrana Ekle</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uygulama olarak kullan</div>
          </div>
          <button onClick={() => setShowIOSGuide(!showIOSGuide)} className="btn-amber" style={{ padding: '8px 12px', fontSize: '12px' }}>
            NasÄ±l?
          </button>
          <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>âœ•</button>
        </div>
        {showIOSGuide && (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            1. Safari'de <strong style={{ color: 'var(--amber-light)' }}>â¬†ï¸ PaylaÅŸ</strong> butonuna bas<br />
            2. <strong style={{ color: 'var(--amber-light)' }}>"Ana Ekrana Ekle"</strong> seÃ§eneÄŸine dokun<br />
            3. <strong style={{ color: 'var(--amber-light)' }}>"Ekle"</strong> butonuna bas
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)',
      borderRadius: '14px', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{ fontSize: '22px' }}>ğŸ“²</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber-light)' }}>UygulamayÄ± YÃ¼kle</div>
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
        className="btn-amber" style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
      >
        YÃ¼kle
      </button>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>âœ•</button>
    </div>
  );
}


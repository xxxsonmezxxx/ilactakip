'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';

export default function LoginPage() {
  const { user, login } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) router.replace('/dashboard');
  }, [user, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (isAdminMode) {
      if (adminUser !== 'admin' || adminPass !== 'admin2026!') {
        setError('GeÃ§ersiz yÃ¶netici bilgileri.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        login({ name: 'admin', email: 'admin', isAdmin: true });
        router.push('/admin');
      }, 600);
      return;
    }

    if (!name.trim()) { setError('LÃ¼tfen adÄ±nÄ±zÄ± girin.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('GeÃ§erli bir e-posta girin.'); return; }
    
    setLoading(true);
    setTimeout(() => {
      login({ name: name.trim(), email: email.trim().toLowerCase() });
      router.push('/dashboard');
    }, 600);
  }

  if (!mounted) return null;

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative glows */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(200,148,62,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(168,120,48,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '88px', height: '88px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 50%, var(--fur-deep) 100%)',
            borderRadius: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '42px',
            boxShadow: '0 8px 32px rgba(212,162,74,0.35), 0 0 0 1px rgba(200,148,62,0.2)',
            position: 'relative', overflow: 'hidden',
          }}>
            <span style={{ position: 'relative', zIndex: 1 }}>ğŸ†</span>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
            }} />
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '6px', background: 'linear-gradient(135deg, var(--gold-bright), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LeoparlÄ± Ä°laÃ§ Takibim
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            L.Ä°.T â€” SaÄŸlÄ±ÄŸÄ±n zamanÄ±, ilacÄ±n ihmal edilmesin
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card leopard-border" style={{ padding: '32px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>{isAdminMode ? 'YÃ¶netici GiriÅŸi ğŸ”' : 'HoÅŸ Geldiniz ğŸ‘‹'}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {isAdminMode ? 'YÃ¶netim paneline eriÅŸmek iÃ§in giriÅŸ yapÄ±n' : 'Ä°laÃ§ takibine baÅŸlamak iÃ§in giriÅŸ yapÄ±n'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '11px' }}
            >
              {isAdminMode ? 'KullanÄ±cÄ±' : 'YÃ¶netici'}
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {isAdminMode ? (
              <>
                <div>
                  <label className="input-label">
                    <span style={{ marginRight: '6px' }}>ğŸ”‘</span> KullanÄ±cÄ± AdÄ±
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="admin"
                    value={adminUser}
                    onChange={e => setAdminUser(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="input-label">
                    <span style={{ marginRight: '6px' }}>ğŸ”’</span> Åifre
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="input-label">
                    <span style={{ marginRight: '6px' }}>ğŸ‘¤</span> AdÄ±nÄ±z SoyadÄ±nÄ±z
                  </label>
                  <input
                    id="login-name"
                    type="text"
                    className="input-field"
                    placeholder="Ã–rn: Ahmet YÄ±lmaz"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="input-label">
                    <span style={{ marginRight: '6px' }}>ğŸ“§</span> E-posta Adresiniz
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="input-field"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#F87171',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                âš ï¸ {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn-amber"
              disabled={loading}
              style={{ padding: '14px', fontSize: '16px', marginTop: '4px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  GiriÅŸ yapÄ±lÄ±yor...
                </span>
              ) : 'ğŸ† GiriÅŸ Yap'}
            </button>
          </form>
        </div>

        {/* Features hint */}
        <div style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
          {[
            { icon: 'â°', label: 'AkÄ±llÄ± Alarm' },
            { icon: 'ğŸ½ï¸', label: 'AÃ§/Tok UyarÄ±' },
            { icon: 'ğŸ“Š', label: 'GÃ¼nlÃ¼k Takip' },
          ].map(f => (
            <div key={f.label} style={{
              background: 'rgba(200,148,62,0.06)', border: '1px solid rgba(200,148,62,0.12)',
              borderRadius: '12px', padding: '14px 8px',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}


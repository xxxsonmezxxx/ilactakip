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
        setError('Geçersiz yönetici bilgileri.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        login({ name: 'admin', email: 'admin', isAdmin: true });
        router.push('/admin');
      }, 500);
      return;
    }

    if (!name.trim()) {
      setError('Lütfen adınızı girin.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Geçerli bir e-posta girin.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login({ name: name.trim(), email: email.trim().toLowerCase() });
      router.push('/dashboard');
    }, 500);
  }

  if (!mounted) return null;

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '88px', height: '88px', margin: '0 auto 16px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', background: 'linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 50%, var(--fur-deep) 100%)' }}>🐆</div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '6px' }}>Leoparlı İlaç Takibim</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sağlığın zamanı, ilacın ihmal edilmesin.</p>
        </div>

        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{isAdminMode ? 'Yönetici Girişi' : 'Hoş Geldiniz'}</h2>
            <button type="button" onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }} className="btn-ghost" style={{ padding: '6px 10px', fontSize: '11px' }}>
              {isAdminMode ? 'Kullanıcı' : 'Yönetici'}
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isAdminMode ? (
              <>
                <input type="text" className="input-field" placeholder="Yönetici kullanıcı adı" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} disabled={loading} />
                <input type="password" className="input-field" placeholder="Şifre" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} disabled={loading} />
              </>
            ) : (
              <>
                <input type="text" className="input-field" placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                <input type="email" className="input-field" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              </>
            )}

            {error && <div style={{ color: '#dc2626', fontSize: '13px' }}>⚠️ {error}</div>}

            <button type="submit" className="btn-amber" disabled={loading} style={{ padding: '14px', fontSize: '15px' }}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

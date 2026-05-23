'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';

export default function AdminPage() {
  const { user, allUsers, getAllMedicines, logout } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) router.replace('/login');
    else if (!user.isAdmin) router.replace('/dashboard');
  }, [user, router]);

  if (!mounted || !user || !user.isAdmin) return null;

  const allMedicines = getAllMedicines();
  const totalUsers = allUsers.filter((u) => !u.isAdmin).length;
  const totalMedicines = allMedicines.length;

  const usersWithMeds = allUsers.filter((u) => !u.isAdmin).map((u) => ({
    user: u,
    medicines: allMedicines.filter((m) => m.userEmail === u.email),
  }));

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '20px' }}>
      <div className="page-header" style={{ borderBottomColor: 'rgba(217,119,6,0.3)' }}>
        <span style={{ fontSize: '22px' }}>🛡️</span>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>Yönetici Paneli</h1>
        <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>Çıkış</button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--amber-light)' }}>{totalUsers}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kayıtlı Kullanıcı</div>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💊</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--amber-light)' }}>{totalMedicines}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aktif İlaç</div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Kullanıcı Listesi</h2>
          {usersWithMeds.length === 0 ? (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Henüz kullanıcı bulunmuyor.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {usersWithMeds.map(({ user: u, medicines: meds }) => (
                <div key={u.email} className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedUser(expandedUser === u.email ? null : u.email)}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{meds.length} ilaç</div>
                  </div>

                  {expandedUser === u.email && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {meds.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>İlaç kaydı yok.</p>
                      ) : (
                        meds.map((m) => (
                          <div key={m.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
                            <div style={{ fontWeight: 700 }}>{m.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.schedule.join(', ')} | {m.days.join(', ')}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

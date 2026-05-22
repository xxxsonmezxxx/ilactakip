'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, MedicineRecord, User } from '../AppContext';

export default function AdminPage() {
  const { user, allUsers, getAllMedicines, logout } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.replace('/login');
    } else if (!user.isAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!mounted || !user || !user.isAdmin) return null;

  const allMedicines = getAllMedicines();
  const totalUsers = allUsers.filter(u => !u.isAdmin).length;
  const totalMedicines = allMedicines.length;

  const usersWithMeds = allUsers.filter(u => !u.isAdmin).map(u => ({
    user: u,
    medicines: allMedicines.filter(m => m.userEmail === u.email)
  }));

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <main style={{ minHeight: '100dvh', paddingBottom: '90px' }}>
      <div className="page-header" style={{ borderBottomColor: 'rgba(217,119,6,0.3)' }}>
        <span style={{ fontSize: '22px' }}>👑</span>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>Yönetici Paneli</h1>
        <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>
          Çıkış
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="glass-card leopard-border" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--amber-light)' }}>{totalUsers}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kayıtlı Kullanıcı</div>
          </div>
          <div className="glass-card leopard-border" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💊</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--amber-light)' }}>{totalMedicines}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aktif İlaç</div>
          </div>
        </div>

        {/* User List */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Kullanıcı Listesi</h2>
          {usersWithMeds.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Henüz kullanıcı bulunmuyor.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {usersWithMeds.map(({ user: u, medicines: meds }) => (
                <div key={u.email} className="glass-card animate-fade-in-up" style={{ padding: '16px' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={() => setExpandedUser(expandedUser === u.email ? null : u.email)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', fontWeight: '700', color: 'var(--amber-light)'
                      }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {meds.length} İlaç
                      </span>
                      <span style={{ fontSize: '18px', transform: expandedUser === u.email ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        ⌄
                      </span>
                    </div>
                  </div>

                  {expandedUser === u.email && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(217,119,6,0.1)' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>Kullanıcının İlaçları:</h4>
                      {meds.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>İlaç kaydı yok.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {meds.map(m => (
                            <div key={m.id} style={{
                              background: 'rgba(20,18,14,0.5)', border: '1px solid rgba(217,119,6,0.1)',
                              borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px'
                            }}>
                              <div className={m.color} style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                              }}>💊</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{m.name}</div>
                                {m.dosage && <div style={{ fontSize: '12px', color: 'var(--amber-light)' }}>Dozaj: {m.dosage}</div>}
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {m.schedule.join(', ')} | {m.days.length === 7 ? 'Hergün' : m.days.join(', ')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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

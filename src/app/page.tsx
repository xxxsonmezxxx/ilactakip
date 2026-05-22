'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppContext';

export default function HomePage() {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '48px', height: '48px',
        border: '3px solid rgba(217,119,6,0.2)',
        borderTopColor: '#D97706',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

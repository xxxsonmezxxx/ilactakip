'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: '🏠' },
  { href: '/ilaclarim', label: 'İlaçlarım', icon: '💊' },
  { href: '/takvim', label: 'Takvim', icon: '📅' },
  { href: '/raporlar', label: 'Raporlar', icon: '📊' },
  { href: '/ayarlar', label: 'Ayarlar', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            id={`nav-${tab.href.replace('/', '')}`}
            className={`nav-tab ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

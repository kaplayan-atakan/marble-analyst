'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/blocks', label: 'Bloklar', icon: '🧱' },
  { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Don't render sidebar on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <aside className="w-64 bg-marble-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Marble Analyst</h1>
        <p className="text-marble-400 text-sm">Blok Takip Sistemi</p>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-marble-700 text-white'
                  : 'text-marble-300 hover:bg-marble-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      {!loading && user && (
        <div className="border-t border-marble-700 pt-4 mt-4">
          <div className="px-4 py-2 mb-2">
            <p className="text-marble-400 text-xs">Giriş yapan:</p>
            <p className="text-white text-sm truncate" title={user.email || ''}>
              {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-marble-300 hover:bg-marble-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      )}
    </aside>
  );
}

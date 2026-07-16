'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, Bell, RefreshCw, Upload } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Watchlist',
      href: '/dashboard',
      icon: Eye,
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: Bell,
    },
    {
      label: 'Sync Items',
      href: '/sync',
      icon: RefreshCw,
    },
    {
      label: 'Manual Ingest',
      href: '/ingest',
      icon: Upload,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">
          CTBids
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Watchlist Manager</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-secondary rounded-lg p-4">
          <p className="text-xs font-semibold text-foreground mb-2">
            Pro Tip
          </p>
          <p className="text-xs text-muted-foreground">
            Set max bid amounts to get alerted when you're outbid
          </p>
        </div>
      </div>
    </aside>
  );
}

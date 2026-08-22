'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { env } from '@/lib/env';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const supabase = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">Account</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-accent" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 hover:bg-secondary transition-colors border-b border-border"
                onClick={() => setShowMenu(false)}
              >
                <Settings size={16} />
                <span className="text-sm">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-secondary transition-colors text-destructive"
              >
                <LogOut size={16} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

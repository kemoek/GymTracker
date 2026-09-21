'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useProfile, useFriendRequests } from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  User,
  LogOut,
  Dumbbell,
  ClipboardList,
} from 'lucide-react';

export function Nav() {
  const pathname = usePathname();
  const { data: profile } = useProfile();
  const { data: requests } = useFriendRequests();
  const { t } = useLanguage();

  const pendingRequestsCount = requests?.length || 0;

  const navItems = [
    { href: '/dashboard', label: t.nav.home, icon: LayoutDashboard },
    { href: '/routine', label: t.nav.routine, icon: ClipboardList },
    { href: '/calendar', label: t.nav.calendar, icon: Calendar },
    { href: '/statistics', label: t.nav.statistics, icon: BarChart3 },
    { href: '/friends', label: t.nav.friends, icon: Users, badge: pendingRequestsCount },
    { href: '/profile', label: t.nav.profile, icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">GymTracker</span>
          </div>
          <LanguageSwitcher />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {profile?.username?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.username}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
              title={t.nav.signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="font-bold text-base">GymTracker</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingRequestsCount > 0 && (
            <Link
              href="/friends"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse"
            >
              <Users className="h-3 w-3" />
              <span>{pendingRequestsCount}</span>
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse shadow">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

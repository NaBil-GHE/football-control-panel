'use client';

import {
  Calendar,
  CalendarRange,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  useApiHealth,
  useCurrentUser,
  useLogout,
} from '@/features/auth/hooks';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Teams', href: '/teams', icon: Users },
  { label: 'Leagues', href: '/leagues', icon: Trophy },
  { label: 'Seasons', href: '/seasons', icon: CalendarRange },
  { label: 'Matches', href: '/matches', icon: Calendar },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const SEGMENT_LABELS: Record<string, string> = {
  teams: 'Teams',
  leagues: 'Leagues',
  seasons: 'Seasons',
  matches: 'Matches',
  settings: 'Settings',
};

function buildBreadcrumbs(pathname: string) {
  if (pathname === '/') {
    return {
      title: 'Overview',
      crumbs: [{ label: 'Overview', href: '/' }],
    };
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Overview', href: '/' }];
  let acc = '';

  segments.forEach((seg, idx) => {
    acc += `/${seg}`;
    const known = SEGMENT_LABELS[seg];
    const label =
      known ||
      (idx > 0 && segments[idx - 1] === 'matches'
        ? 'Match details'
        : idx > 0 && segments[idx - 1] === 'leagues'
          ? 'League details'
          : idx > 0 && segments[idx - 1] === 'teams'
            ? 'Team details'
            : seg);
    crumbs.push({ label, href: acc });
  });

  return {
    title: crumbs[crumbs.length - 1]?.label || 'Overview',
    crumbs,
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = useCurrentUser();
  const { data: health, isError: healthError } = useApiHealth();
  const logout = useLogout();

  const { title, crumbs } = buildBreadcrumbs(pathname);
  const isApiOnline = !healthError && health?.status === 'ok';

  const renderNav = (onSelect?: () => void) => (
    <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onSelect}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-700/20 text-emerald-400 border-l-2 border-emerald-500 pl-2.5'
                : 'text-slate-300 hover:bg-[#1a222b] hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f6f7f9]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-[#0f1419] text-slate-100 lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-800/80 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-700 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-white">
              Football Console
            </div>
            <div className="text-[11px] text-slate-400">Admin control panel</div>
          </div>
        </div>

        {renderNav()}

        <div className="border-t border-slate-800/80 px-4 py-3 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>API status</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-medium',
                isApiOnline ? 'text-emerald-400' : 'text-amber-400',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isApiOnline ? 'bg-emerald-400' : 'bg-amber-400',
                )}
              />
              {isApiOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex w-64 flex-col bg-[#0f1419] text-slate-100">
            <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700 text-white">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Football Console
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderNav(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-xs text-slate-500"
              >
                {crumbs.map((crumb, idx) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                    {idx === crumbs.length - 1 ? (
                      <span className="font-medium text-slate-700 truncate">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-slate-900 truncate"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
              <h1 className="truncate text-sm font-semibold text-slate-900 leading-tight">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              title={
                isApiOnline
                  ? `API healthy — MongoDB ${health?.database.state}`
                  : 'Unable to reach Football API'
              }
              className={cn(
                'hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                isApiOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isApiOnline ? 'bg-emerald-600' : 'bg-red-600',
                )}
              />
              {isApiOnline ? 'API connected' : 'API disconnected'}
            </div>

            {user && (
              <div className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-xs font-semibold text-slate-800">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500">{user.email}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

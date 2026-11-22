'use client';

import { ExternalLink, LogOut, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  useApiHealth,
  useCurrentUser,
  useLogout,
} from '@/features/auth/hooks';
import { formatDateTime } from '@/lib/utils';

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const { data: health, isError, isFetching, refetch } = useApiHealth();
  const logout = useLogout();

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const isHealthy = !isError && health?.status === 'ok';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <p className="text-xs text-slate-500">
          Administrator session details and Football API connectivity.
        </p>
      </div>

      {/* Admin Profile */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            Administrator session
          </h3>
        </div>

        {user ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Role</dt>
              <dd className="mt-0.5">
                <StatusBadge label={user.role} tone="green" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Session storage</dt>
              <dd className="text-slate-700">HttpOnly server cookie</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Loading profile...</p>
        )}

        <div className="border-t border-slate-100 pt-3">
          <Button
            variant="outline"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </section>

      {/* Backend Connection */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Football API connection
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
            />
            Check health
          </Button>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">API base URL</dt>
            <dd className="font-mono text-xs text-slate-800 break-all mt-0.5">
              {apiBaseUrl}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Server status</dt>
            <dd className="mt-0.5">
              <StatusBadge
                label={isHealthy ? 'Healthy' : 'Disconnected'}
                tone={isHealthy ? 'green' : 'red'}
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">MongoDB state</dt>
            <dd className="text-slate-800">
              {health?.database?.state ?? 'unreachable'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Last checked</dt>
            <dd className="text-slate-700 tabular-nums">
              {health?.timestamp ? formatDateTime(health.timestamp) : '—'}
            </dd>
          </div>
        </dl>

        <div className="border-t border-slate-100 pt-3">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`${apiBaseUrl.replace(/\/+$/, '')}/docs`}
              target="_blank"
              rel="noreferrer"
            >
              Open Swagger API docs
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

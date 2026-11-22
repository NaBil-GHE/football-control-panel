'use client';

import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  CardGridSkeleton,
  TableSkeleton,
} from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { useDashboardOverview } from '@/features/dashboard/hooks';
import { ApiClientError } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { Match } from '@/types/api';

function MatchCompactRow({ match }: { match: Match }) {
  const isLive = match.status === 'live' || match.status === 'halftime';
  const showScore =
    match.status === 'live' ||
    match.status === 'halftime' ||
    match.status === 'finished';

  return (
    <Link
      href={`/matches/${match._id}`}
      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-900">
            {match.homeTeam?.name ?? 'Home'}
          </span>
          <span className="text-xs text-slate-400">vs</span>
          <span className="truncate font-medium text-slate-900">
            {match.awayTeam?.name ?? 'Away'}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="truncate">{match.league?.name}</span>
          <span>•</span>
          <span className="tabular-nums">{formatDateTime(match.kickoff)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {showScore && (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-900 tabular-nums">
            {match.homeScore} - {match.awayScore}
          </span>
        )}
        {isLive && (
          <span className="text-xs font-semibold text-emerald-700 tabular-nums">
            {match.minute}&apos;
          </span>
        )}
        <StatusBadge matchStatus={match.status} />
      </div>
    </Link>
  );
}

export default function OverviewPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardGridSkeleton count={4} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TableSkeleton rows={4} columns={3} />
          <TableSkeleton rows={4} columns={3} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load dashboard overview"
        message={
          error instanceof ApiClientError
            ? error.message
            : 'Check that the Football API server is running.'
        }
        onRetry={() => refetch()}
      />
    );
  }

  const stats = [
    {
      label: 'Total teams',
      value: data.counts.teams,
      href: '/teams',
      icon: Users,
      accent: false,
    },
    {
      label: 'Total leagues',
      value: data.counts.leagues,
      href: '/leagues',
      icon: Trophy,
      accent: false,
    },
    {
      label: 'Total matches',
      value: data.counts.matches,
      href: '/matches',
      icon: Calendar,
      accent: false,
    },
    {
      label: 'Live matches',
      value: data.counts.liveMatches,
      href: '/matches?status=live',
      icon: Activity,
      accent: data.counts.liveMatches > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {stat.label}
                </span>
                <Icon
                  className={
                    stat.accent
                      ? 'h-4 w-4 text-emerald-600'
                      : 'h-4 w-4 text-slate-400'
                  }
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span
                  className={
                    stat.accent
                      ? 'text-2xl font-bold text-emerald-700 tabular-nums'
                      : 'text-2xl font-bold text-slate-900 tabular-nums'
                  }
                >
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-700">
                  View
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Live Matches */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Live matches
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
              {data.counts.liveMatches}
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/matches">
              Manage matches
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {data.liveMatches.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Activity}
              title="No matches currently live"
              description="Start a scheduled match from the Matches console to track live minutes, scores, and events."
              action={
                <Button size="sm" asChild>
                  <Link href="/matches">Open matches</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.liveMatches.map((match) => (
              <MatchCompactRow key={match._id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming & Recent Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">
                Upcoming matches
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
                {data.counts.upcomingMatches}
              </span>
            </div>
            <Link
              href="/matches?status=scheduled"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>
          {data.upcomingMatches.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Calendar}
                title="No upcoming fixtures"
                description="Schedule new matches to see upcoming kickoffs here."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.upcomingMatches.map((match) => (
                <MatchCompactRow key={match._id} match={match} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">
                Recent results
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
                {data.counts.finishedMatches}
              </span>
            </div>
            <Link
              href="/matches?status=finished"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentResults.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CheckCircle2}
                title="No finished matches yet"
                description="Completed match results will appear here automatically."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentResults.map((match) => (
                <MatchCompactRow key={match._id} match={match} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

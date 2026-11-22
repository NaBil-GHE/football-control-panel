'use client';

import { Calendar, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { FormDialog } from '@/components/shared/form-dialog';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useLeagues, useLeagueSeasons } from '@/features/leagues/hooks';
import {
  useCreateMatch,
  useDeleteMatch,
  useMatches,
  useUpdateMatch,
} from '@/features/matches/hooks';
import { MatchForm } from '@/features/matches/match-form';
import { ApiClientError } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import {
  MATCH_STATUSES,
  type CreateMatchPayload,
  type Match,
  type MatchStatus,
} from '@/types/api';

function MatchesContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as MatchStatus) || '';

  const [page, setPage] = useState(1);
  const [leagueId, setLeagueId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [status, setStatus] = useState<MatchStatus | ''>(
    MATCH_STATUSES.includes(initialStatus as MatchStatus) ? initialStatus : '',
  );
  const [simFilter, setSimFilter] = useState<'' | 'true' | 'false'>('');
  const [dateFilter, setDateFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);

  const { data: leaguesData } = useLeagues({ page: 1, limit: 100 });
  const { data: seasons = [] } = useLeagueSeasons(leagueId);

  const fromIso = dateFilter
    ? new Date(`${dateFilter}T00:00:00.000Z`).toISOString()
    : undefined;
  const toIso = dateFilter
    ? new Date(`${dateFilter}T23:59:59.999Z`).toISOString()
    : undefined;

  const { data, isLoading, isError, error, refetch } = useMatches({
    page,
    limit: 15,
    league: leagueId || undefined,
    season: seasonId || undefined,
    status,
    isSimulation: simFilter,
    from: fromIso,
    to: toIso,
  });

  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const deleteMatch = useDeleteMatch();

  const handleSave = async (payload: CreateMatchPayload) => {
    try {
      if (editingMatch) {
        await updateMatch.mutateAsync({ id: editingMatch._id, payload });
        toast.success('Match updated');
      } else {
        await createMatch.mutateAsync(payload);
        toast.success('Match created');
      }
      setFormOpen(false);
      setEditingMatch(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to save match',
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingMatch) return;
    try {
      await deleteMatch.mutateAsync(deletingMatch._id);
      toast.success('Match deleted');
      setDeletingMatch(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete match',
      );
    }
  };

  const columns: Column<Match>[] = [
    {
      key: 'kickoff',
      header: 'Kickoff',
      className: 'tabular-nums whitespace-nowrap text-xs text-slate-600',
      render: (m) => formatDateTime(m.kickoff),
    },
    {
      key: 'fixture',
      header: 'Fixture',
      render: (m) => (
        <div>
          <Link
            href={`/matches/${m._id}`}
            className="font-medium text-slate-900 hover:text-emerald-700 hover:underline"
          >
            {m.homeTeam?.name ?? 'Home'}{' '}
            <span className="text-slate-400 font-normal">vs</span>{' '}
            {m.awayTeam?.name ?? 'Away'}
          </Link>
          <div className="text-xs text-slate-500">
            {m.league?.name}
            {m.round ? ` • ${m.round}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      className: 'tabular-nums font-semibold whitespace-nowrap',
      render: (m) => {
        if (
          m.status === 'scheduled' ||
          m.status === 'postponed' ||
          m.status === 'cancelled'
        ) {
          return <span className="text-slate-400 font-normal">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <span>
              {m.homeScore} - {m.awayScore}
            </span>
            {(m.status === 'live' || m.status === 'halftime') && (
              <span className="text-xs font-semibold text-emerald-700">
                {m.minute}&apos;
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge matchStatus={m.status} />
          {m.isSimulation && <StatusBadge label="Sim" tone="blue" />}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (m) => (
        <div className="inline-flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild title="Control match">
            <Link href={`/matches/${m._id}`} aria-label="Open match console">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit match"
            aria-label="Edit match"
            onClick={() => {
              setEditingMatch(m);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete match"
            aria-label="Delete match"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeletingMatch(m)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(
    leagueId || seasonId || status || dateFilter || simFilter,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Matches</h2>
          <p className="text-xs text-slate-500">
            Schedule fixtures, control live match states, and record events.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingMatch(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create match
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={leagueId}
          onChange={(e) => {
            setLeagueId(e.target.value);
            setSeasonId('');
            setPage(1);
          }}
          aria-label="Filter by league"
          className="w-full sm:w-48"
        >
          <option value="">All leagues</option>
          {(leaguesData?.data ?? []).map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </Select>

        <Select
          value={seasonId}
          disabled={!leagueId || seasons.length === 0}
          onChange={(e) => {
            setSeasonId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by season"
          className="w-full sm:w-44"
        >
          <option value="">All seasons</option>
          {seasons.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as MatchStatus | '');
            setPage(1);
          }}
          aria-label="Filter by status"
          className="w-full sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="halftime">Halftime</option>
          <option value="finished">Finished</option>
          <option value="postponed">Postponed</option>
          <option value="cancelled">Cancelled</option>
        </Select>

        <Select
          value={simFilter}
          onChange={(e) => {
            setSimFilter(e.target.value as '' | 'true' | 'false');
            setPage(1);
          }}
          aria-label="Filter by match mode"
          className="w-full sm:w-40"
        >
          <option value="">All modes</option>
          <option value="true">Simulation only</option>
          <option value="false">Standard only</option>
        </Select>

        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by match date"
          className="w-full sm:w-40"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLeagueId('');
              setSeasonId('');
              setStatus('');
              setSimFilter('');
              setDateFilter('');
              setPage(1);
            }}
          >
            Reset filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : isError ? (
        <ErrorState
          title="Could not load matches"
          message={error instanceof ApiClientError ? error.message : undefined}
          onRetry={() => refetch()}
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No matches found"
          description={
            hasFilters
              ? 'No matches match your current filter selection.'
              : 'Create your first match fixture to begin tracking scores and events.'
          }
          action={
            !hasFilters ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditingMatch(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Create match
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            rowKey={(m) => m._id}
          />
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingMatch(null);
        }}
        title={editingMatch ? 'Edit match' : 'Create match'}
        description="Home and away teams must be different. Season must belong to the selected league."
      >
        <MatchForm
          key={editingMatch?._id ?? 'new'}
          initialData={editingMatch}
          isSubmitting={createMatch.isPending || updateMatch.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSave}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deletingMatch)}
        onOpenChange={(open) => {
          if (!open) setDeletingMatch(null);
        }}
        title="Delete match"
        description={
          deletingMatch
            ? `Delete ${deletingMatch.homeTeam?.name} vs ${deletingMatch.awayTeam?.name}? All recorded match events for this fixture will also be permanently deleted.`
            : ''
        }
        confirmLabel="Delete match"
        isLoading={deleteMatch.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} columns={5} />}>
      <MatchesContent />
    </Suspense>
  );
}

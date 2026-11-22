'use client';

import {
  ArrowLeft,
  CalendarRange,
  Check,
  Pencil,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { FormDialog } from '@/components/shared/form-dialog';
import {
  LoadingSkeleton,
  TableSkeleton,
} from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  useCreateSeason,
  useDeleteLeague,
  useDeleteSeason,
  useLeague,
  useLeagueStandings,
  useUpdateLeague,
  useUpdateSeason,
} from '@/features/leagues/hooks';
import { LeagueForm } from '@/features/leagues/league-form';
import { SeasonForm } from '@/features/leagues/season-form';
import { ApiClientError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import type {
  CreateLeaguePayload,
  CreateSeasonPayload,
  Season,
  StandingRow,
} from '@/types/api';

export default function LeagueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const leagueId = params.id;

  const [editLeagueOpen, setEditLeagueOpen] = useState(false);
  const [deleteLeagueOpen, setDeleteLeagueOpen] = useState(false);

  const [seasonFormOpen, setSeasonFormOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);

  const [selectedStandingSeasonId, setSelectedStandingSeasonId] = useState('');

  const { data: league, isLoading, isError, error, refetch } = useLeague(leagueId);
  const { data: standingsData, isLoading: standingsLoading } =
    useLeagueStandings(leagueId, selectedStandingSeasonId || undefined);

  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
  const deleteSeason = useDeleteSeason();

  const handleUpdateLeague = async (payload: CreateLeaguePayload) => {
    try {
      await updateLeague.mutateAsync({ id: leagueId, payload });
      toast.success('League updated');
      setEditLeagueOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to update league',
      );
    }
  };

  const handleDeleteLeague = async () => {
    try {
      await deleteLeague.mutateAsync(leagueId);
      toast.success('League deleted');
      router.replace('/leagues');
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete league',
      );
      setDeleteLeagueOpen(false);
    }
  };

  const handleSaveSeason = async (payload: CreateSeasonPayload) => {
    try {
      if (editingSeason) {
        await updateSeason.mutateAsync({
          leagueId,
          seasonId: editingSeason._id,
          payload,
        });
        toast.success(`Updated season ${payload.name}`);
      } else {
        await createSeason.mutateAsync({ leagueId, payload });
        toast.success(`Created season ${payload.name}`);
      }
      setSeasonFormOpen(false);
      setEditingSeason(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to save season',
      );
    }
  };

  const handleSetCurrentSeason = async (season: Season) => {
    try {
      await updateSeason.mutateAsync({
        leagueId,
        seasonId: season._id,
        payload: { current: true },
      });
      toast.success(`${season.name} is now the active season`);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : 'Failed to set current season',
      );
    }
  };

  const handleDeleteSeason = async () => {
    if (!deletingSeason) return;
    try {
      await deleteSeason.mutateAsync({
        leagueId,
        seasonId: deletingSeason._id,
      });
      toast.success(`Deleted season ${deletingSeason.name}`);
      setDeletingSeason(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete season',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-24 w-full" />
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  if (isError || !league) {
    return (
      <ErrorState
        title="League not found"
        message={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  const seasonColumns: Column<Season>[] = [
    {
      key: 'name',
      header: 'Season',
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{s.name}</span>
          {s.current && <StatusBadge label="Current" tone="green" />}
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Start date',
      className: 'tabular-nums text-slate-600',
      render: (s) => formatDate(s.startDate),
    },
    {
      key: 'endDate',
      header: 'End date',
      className: 'tabular-nums text-slate-600',
      render: (s) => formatDate(s.endDate),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (s) => (
        <div className="inline-flex items-center justify-end gap-1">
          {!s.current && (
            <Button
              variant="outline"
              size="sm"
              disabled={updateSeason.isPending}
              onClick={() => handleSetCurrentSeason(s)}
            >
              <Check className="h-3.5 w-3.5" />
              Set current
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit season ${s.name}`}
            onClick={() => {
              setEditingSeason(s);
              setSeasonFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete season ${s.name}`}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeletingSeason(s)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const standingColumns: Column<StandingRow>[] = [
    {
      key: 'pos',
      header: '#',
      className: 'tabular-nums font-semibold w-10',
      render: (r) => r.position,
    },
    {
      key: 'team',
      header: 'Team',
      render: (r) => (
        <Link
          href={`/teams/${r.team._id}`}
          className="font-medium text-slate-900 hover:text-emerald-700 hover:underline"
        >
          {r.team.name}
        </Link>
      ),
    },
    { key: 'p', header: 'P', className: 'tabular-nums', render: (r) => r.played },
    { key: 'w', header: 'W', className: 'tabular-nums', render: (r) => r.won },
    { key: 'd', header: 'D', className: 'tabular-nums', render: (r) => r.drawn },
    { key: 'l', header: 'L', className: 'tabular-nums', render: (r) => r.lost },
    { key: 'gf', header: 'GF', className: 'tabular-nums', render: (r) => r.goalsFor },
    { key: 'ga', header: 'GA', className: 'tabular-nums', render: (r) => r.goalsAgainst },
    {
      key: 'gd',
      header: 'GD',
      className: 'tabular-nums',
      render: (r) => (r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference),
    },
    {
      key: 'pts',
      header: 'Pts',
      className: 'tabular-nums font-bold text-slate-900',
      render: (r) => r.points,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/leagues">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to leagues
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditLeagueOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit league
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteLeagueOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete league
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-5">
        {league.logo ? (
          <img
            src={league.logo}
            alt={league.name}
            className="h-12 w-12 rounded-lg border border-slate-200 object-contain p-1"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Trophy className="h-5 w-5" />
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">
              {league.name}
            </h2>
            <StatusBadge leagueType={league.type} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{league.country}</p>
        </div>
      </div>

      {/* Seasons Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Seasons</h3>
            <p className="text-xs text-slate-500">
              Only one season per league can be active at a time.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingSeason(null);
              setSeasonFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add season
          </Button>
        </div>

        {league.seasons.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="No seasons configured"
            description="Create a season for this league before scheduling matches."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingSeason(null);
                  setSeasonFormOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add season
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={seasonColumns}
            data={league.seasons}
            rowKey={(s) => s._id}
          />
        )}
      </section>

      {/* Standings Section */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Standings</h3>
            <p className="text-xs text-slate-500">
              Calculated from finished matches (3 pts win, 1 pt draw).
            </p>
          </div>
          {league.seasons.length > 0 && (
            <Select
              value={selectedStandingSeasonId}
              onChange={(e) => setSelectedStandingSeasonId(e.target.value)}
              aria-label="Select season for standings"
              className="w-48"
            >
              <option value="">Active / latest season</option>
              {league.seasons.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.current ? '(Current)' : ''}
                </option>
              ))}
            </Select>
          )}
        </div>

        {standingsLoading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : !standingsData || standingsData.standings.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No standings available yet"
            description="Finish at least one match in this season to populate the league table."
          />
        ) : (
          <DataTable
            columns={standingColumns}
            data={standingsData.standings}
            rowKey={(r) => r.team._id}
          />
        )}
      </section>

      <FormDialog
        open={editLeagueOpen}
        onOpenChange={setEditLeagueOpen}
        title={`Edit ${league.name}`}
      >
        <LeagueForm
          initialData={league}
          isSubmitting={updateLeague.isPending}
          onCancel={() => setEditLeagueOpen(false)}
          onSubmit={handleUpdateLeague}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteLeagueOpen}
        onOpenChange={setDeleteLeagueOpen}
        title="Delete league"
        description={`Delete "${league.name}"? Leagues with seasons or matches cannot be deleted.`}
        confirmLabel="Delete league"
        isLoading={deleteLeague.isPending}
        onConfirm={handleDeleteLeague}
      />

      <FormDialog
        open={seasonFormOpen}
        onOpenChange={(open) => {
          setSeasonFormOpen(open);
          if (!open) setEditingSeason(null);
        }}
        title={
          editingSeason
            ? `Edit season ${editingSeason.name}`
            : `Add season to ${league.name}`
        }
      >
        <SeasonForm
          key={editingSeason?._id ?? 'new'}
          initialData={editingSeason}
          isSubmitting={createSeason.isPending || updateSeason.isPending}
          onCancel={() => setSeasonFormOpen(false)}
          onSubmit={handleSaveSeason}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deletingSeason)}
        onOpenChange={(open) => {
          if (!open) setDeletingSeason(null);
        }}
        title="Delete season"
        description={
          deletingSeason
            ? `Delete season "${deletingSeason.name}"? Seasons with existing matches cannot be deleted.`
            : ''
        }
        confirmLabel="Delete season"
        isLoading={deleteSeason.isPending}
        onConfirm={handleDeleteSeason}
      />
    </div>
  );
}

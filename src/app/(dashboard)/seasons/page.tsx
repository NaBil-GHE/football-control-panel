'use client';

import { CalendarRange, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { FormDialog } from '@/components/shared/form-dialog';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  useCreateSeason,
  useDeleteSeason,
  useLeagues,
  useLeagueSeasons,
  useUpdateSeason,
} from '@/features/leagues/hooks';
import { SeasonForm } from '@/features/leagues/season-form';
import { ApiClientError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import type { CreateSeasonPayload, Season } from '@/types/api';

export default function SeasonsPage() {
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);

  const {
    data: leaguesData,
    isLoading: leaguesLoading,
    isError: leaguesError,
    error: leaguesErr,
    refetch: refetchLeagues,
  } = useLeagues({ page: 1, limit: 100 });

  const leagues = leaguesData?.data ?? [];
  const activeLeagueId = selectedLeagueId || leagues[0]?._id || '';
  const activeLeague = leagues.find((l) => l._id === activeLeagueId);

  const {
    data: seasons,
    isLoading: seasonsLoading,
    isError: seasonsError,
    error: seasonsErr,
    refetch: refetchSeasons,
  } = useLeagueSeasons(activeLeagueId);

  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
  const deleteSeason = useDeleteSeason();

  const handleSave = async (payload: CreateSeasonPayload) => {
    if (!activeLeagueId) return;
    try {
      if (editingSeason) {
        await updateSeason.mutateAsync({
          leagueId: activeLeagueId,
          seasonId: editingSeason._id,
          payload,
        });
        toast.success(`Updated season ${payload.name}`);
      } else {
        await createSeason.mutateAsync({ leagueId: activeLeagueId, payload });
        toast.success(`Created season ${payload.name}`);
      }
      setFormOpen(false);
      setEditingSeason(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to save season',
      );
    }
  };

  const handleSetCurrent = async (season: Season) => {
    if (!activeLeagueId) return;
    try {
      await updateSeason.mutateAsync({
        leagueId: activeLeagueId,
        seasonId: season._id,
        payload: { current: true },
      });
      toast.success(`${season.name} set as current season`);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : 'Failed to update season',
      );
    }
  };

  const handleDelete = async () => {
    if (!activeLeagueId || !deletingSeason) return;
    try {
      await deleteSeason.mutateAsync({
        leagueId: activeLeagueId,
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

  if (leaguesLoading) {
    return <TableSkeleton rows={4} columns={4} />;
  }

  if (leaguesError) {
    return (
      <ErrorState
        title="Could not load leagues"
        message={
          leaguesErr instanceof ApiClientError ? leaguesErr.message : undefined
        }
        onRetry={() => refetchLeagues()}
      />
    );
  }

  if (leagues.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="Create a league first"
        description="Seasons belong to a league. Create at least one league to manage seasons."
        action={
          <Button size="sm" asChild>
            <Link href="/leagues">Go to leagues</Link>
          </Button>
        }
      />
    );
  }

  const columns: Column<Season>[] = [
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
      key: 'start',
      header: 'Start date',
      className: 'tabular-nums text-slate-600',
      render: (s) => formatDate(s.startDate),
    },
    {
      key: 'end',
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
              onClick={() => handleSetCurrent(s)}
            >
              <Check className="h-3.5 w-3.5" />
              Set current
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${s.name}`}
            onClick={() => {
              setEditingSeason(s);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${s.name}`}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeletingSeason(s)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Seasons</h2>
          <p className="text-xs text-slate-500">
            Select a league to manage its seasons and active campaign.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSeason(null);
            setFormOpen(true);
          }}
          disabled={!activeLeagueId}
        >
          <Plus className="h-4 w-4" />
          Create season
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={activeLeagueId}
          onChange={(e) => setSelectedLeagueId(e.target.value)}
          aria-label="Select league"
          className="w-full sm:w-72"
        >
          {leagues.map((league) => (
            <option key={league._id} value={league._id}>
              {league.name} ({league.country})
            </option>
          ))}
        </Select>

        {activeLeague && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/leagues/${activeLeague._id}`}>
              View standings & details
            </Link>
          </Button>
        )}
      </div>

      {seasonsLoading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : seasonsError ? (
        <ErrorState
          title="Could not load seasons"
          message={
            seasonsErr instanceof ApiClientError
              ? seasonsErr.message
              : undefined
          }
          onRetry={() => refetchSeasons()}
        />
      ) : !seasons || seasons.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title={`No seasons in ${activeLeague?.name ?? 'this league'}`}
          description="Create a season with UTC start and end dates."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingSeason(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create season
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={seasons} rowKey={(s) => s._id} />
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSeason(null);
        }}
        title={
          editingSeason
            ? `Edit season ${editingSeason.name}`
            : `Create season in ${activeLeague?.name ?? ''}`
        }
      >
        <SeasonForm
          key={editingSeason?._id ?? 'new'}
          initialData={editingSeason}
          isSubmitting={createSeason.isPending || updateSeason.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSave}
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
            ? `Delete "${deletingSeason.name}"? Seasons with existing matches cannot be deleted.`
            : ''
        }
        confirmLabel="Delete season"
        isLoading={deleteSeason.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

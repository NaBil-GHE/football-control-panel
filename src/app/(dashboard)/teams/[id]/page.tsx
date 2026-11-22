'use client';

import { ArrowLeft, Calendar, MapPin, Pencil, Trash2 } from 'lucide-react';
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
import { useMatches } from '@/features/matches/hooks';
import {
  useDeleteTeam,
  useTeam,
  useUpdateTeam,
} from '@/features/teams/hooks';
import { TeamForm } from '@/features/teams/team-form';
import { ApiClientError } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { CreateTeamPayload, Match } from '@/types/api';

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const teamId = params.id;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: team, isLoading, isError, error, refetch } = useTeam(teamId);
  const { data: matchesData, isLoading: matchesLoading } = useMatches({
    team: teamId,
    limit: 15,
  });

  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const handleUpdate = async (payload: CreateTeamPayload) => {
    try {
      await updateTeam.mutateAsync({ id: teamId, payload });
      toast.success('Team updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to update team',
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTeam.mutateAsync(teamId);
      toast.success('Team deleted');
      router.replace('/teams');
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete team',
      );
      setDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-28 w-full" />
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <ErrorState
        title="Team not found"
        message={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  const matchColumns: Column<Match>[] = [
    {
      key: 'kickoff',
      header: 'Kickoff',
      className: 'tabular-nums whitespace-nowrap text-xs text-slate-600',
      render: (m) => formatDateTime(m.kickoff),
    },
    {
      key: 'fixture',
      header: 'Match',
      render: (m) => (
        <Link
          href={`/matches/${m._id}`}
          className="font-medium text-slate-900 hover:text-emerald-700 hover:underline"
        >
          {m.homeTeam?.name} vs {m.awayTeam?.name}
        </Link>
      ),
    },
    {
      key: 'league',
      header: 'League',
      render: (m) => (
        <span className="text-xs text-slate-600">
          {m.league?.name} ({m.season?.name})
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      className: 'tabular-nums font-semibold',
      render: (m) =>
        m.status === 'scheduled' ||
        m.status === 'postponed' ||
        m.status === 'cancelled'
          ? '—'
          : `${m.homeScore} - ${m.awayScore}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <StatusBadge matchStatus={m.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/teams">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to teams
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit team
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete team
          </Button>
        </div>
      </div>

      {/* Team Summary Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start gap-4">
          {team.logo ? (
            <img
              src={team.logo}
              alt={team.name}
              className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-contain p-1"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-base font-bold text-slate-700">
              {team.shortName.slice(0, 3)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                {team.name}
              </h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {team.shortName}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span>Country: {team.country}</span>
              {team.stadium && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {team.stadium}
                </span>
              )}
              {team.founded && (
                <span className="tabular-nums">Founded: {team.founded}</span>
              )}
            </div>
            {team.description && (
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                {team.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Team Matches */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Team matches</h3>
        {matchesLoading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : !matchesData || matchesData.data.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No matches for this team"
            description="Fixtures involving this team will appear here."
          />
        ) : (
          <DataTable
            columns={matchColumns}
            data={matchesData.data}
            rowKey={(m) => m._id}
          />
        )}
      </section>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={`Edit ${team.name}`}
      >
        <TeamForm
          initialData={team}
          isSubmitting={updateTeam.isPending}
          onCancel={() => setEditOpen(false)}
          onSubmit={handleUpdate}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete team"
        description={`Delete "${team.name}"? Teams referenced by matches cannot be deleted.`}
        confirmLabel="Delete team"
        isLoading={deleteTeam.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

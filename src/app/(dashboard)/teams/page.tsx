'use client';

import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { FormDialog } from '@/components/shared/form-dialog';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useCreateTeam,
  useDeleteTeam,
  useTeams,
  useUpdateTeam,
} from '@/features/teams/hooks';
import { TeamForm } from '@/features/teams/team-form';
import { ApiClientError } from '@/lib/api-client';
import type { CreateTeamPayload, Team } from '@/types/api';

export default function TeamsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState('name');

  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const { data, isLoading, isError, error, refetch } = useTeams({
    page,
    limit: 15,
    search: search || undefined,
    country: country || undefined,
    sort,
  });

  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormOpen(true);
  };

  const handleSave = async (payload: CreateTeamPayload) => {
    try {
      if (editingTeam) {
        await updateTeam.mutateAsync({ id: editingTeam._id, payload });
        toast.success(`Updated ${payload.name}`);
      } else {
        await createTeam.mutateAsync(payload);
        toast.success(`Created ${payload.name}`);
      }
      setFormOpen(false);
      setEditingTeam(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to save team',
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingTeam) return;
    try {
      await deleteTeam.mutateAsync(deletingTeam._id);
      toast.success(`Deleted ${deletingTeam.name}`);
      setDeletingTeam(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete team',
      );
    }
  };

  const columns: Column<Team>[] = [
    {
      key: 'name',
      header: 'Team',
      render: (team) => (
        <div className="flex items-center gap-2.5">
          {team.logo ? (
            <img
              src={team.logo}
              alt=""
              className="h-7 w-7 rounded object-contain border border-slate-200 bg-white p-0.5"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-[11px] font-bold text-slate-600">
              {team.shortName.slice(0, 3)}
            </div>
          )}
          <div>
            <Link
              href={`/teams/${team._id}`}
              className="font-medium text-slate-900 hover:text-emerald-700 hover:underline"
            >
              {team.name}
            </Link>
            <div className="text-xs text-slate-500">{team.shortName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      render: (team) => <span>{team.country}</span>,
    },
    {
      key: 'stadium',
      header: 'Stadium',
      render: (team) => (
        <span className="text-slate-600">{team.stadium || '—'}</span>
      ),
    },
    {
      key: 'founded',
      header: 'Founded',
      className: 'tabular-nums',
      render: (team) => (
        <span className="text-slate-600">{team.founded ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (team) => (
        <div className="inline-flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild title="View team details">
            <Link href={`/teams/${team._id}`} aria-label={`View ${team.name}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit team"
            aria-label={`Edit ${team.name}`}
            onClick={() => handleOpenEdit(team)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete team"
            aria-label={`Delete ${team.name}`}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeletingTeam(team)}
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
          <h2 className="text-lg font-semibold text-slate-900">Teams</h2>
          <p className="text-xs text-slate-500">
            Manage clubs, national teams, stadiums, and metadata.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Create team
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search name, code, or stadium..."
          className="w-full sm:w-64"
          ariaLabel="Search teams"
        />
        <Input
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by country"
          aria-label="Filter by country"
          className="w-full sm:w-44"
        />
        <Select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          aria-label="Sort teams"
          className="w-full sm:w-44"
        >
          <option value="name">Sort: Name (A–Z)</option>
          <option value="-name">Sort: Name (Z–A)</option>
          <option value="-createdAt">Sort: Newest first</option>
          <option value="founded">Sort: Founded (oldest)</option>
          <option value="-founded">Sort: Founded (newest)</option>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : isError ? (
        <ErrorState
          title="Could not load teams"
          message={
            error instanceof ApiClientError ? error.message : undefined
          }
          onRetry={() => refetch()}
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description={
            search || country
              ? 'No teams match your current search or country filter.'
              : 'Create your first football team to start scheduling matches.'
          }
          action={
            !search && !country ? (
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" />
                Create team
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            rowKey={(team) => team._id}
          />
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTeam(null);
        }}
        title={editingTeam ? `Edit ${editingTeam.name}` : 'Create team'}
        description="Fields follow the Football API validation rules."
      >
        <TeamForm
          key={editingTeam?._id ?? 'new'}
          initialData={editingTeam}
          isSubmitting={createTeam.isPending || updateTeam.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSave}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deletingTeam)}
        onOpenChange={(open) => {
          if (!open) setDeletingTeam(null);
        }}
        title="Delete team"
        description={
          deletingTeam
            ? `Delete "${deletingTeam.name}"? Teams referenced by existing matches cannot be deleted.`
            : ''
        }
        confirmLabel="Delete team"
        isLoading={deleteTeam.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

'use client';

import { Eye, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
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
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useCreateLeague,
  useDeleteLeague,
  useLeagues,
  useUpdateLeague,
} from '@/features/leagues/hooks';
import { LeagueForm } from '@/features/leagues/league-form';
import { ApiClientError } from '@/lib/api-client';
import type { CreateLeaguePayload, League, LeagueType } from '@/types/api';

export default function LeaguesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState<LeagueType | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [deletingLeague, setDeletingLeague] = useState<League | null>(null);

  const { data, isLoading, isError, error, refetch } = useLeagues({
    page,
    limit: 15,
    search: search || undefined,
    country: country || undefined,
    type,
  });

  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();

  const handleSave = async (payload: CreateLeaguePayload) => {
    try {
      if (editingLeague) {
        await updateLeague.mutateAsync({ id: editingLeague._id, payload });
        toast.success(`Updated ${payload.name}`);
      } else {
        await createLeague.mutateAsync(payload);
        toast.success(`Created ${payload.name}`);
      }
      setFormOpen(false);
      setEditingLeague(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to save league',
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingLeague) return;
    try {
      await deleteLeague.mutateAsync(deletingLeague._id);
      toast.success(`Deleted ${deletingLeague.name}`);
      setDeletingLeague(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete league',
      );
    }
  };

  const columns: Column<League>[] = [
    {
      key: 'name',
      header: 'League',
      render: (league) => (
        <div className="flex items-center gap-2.5">
          {league.logo ? (
            <img
              src={league.logo}
              alt=""
              className="h-7 w-7 rounded object-contain border border-slate-200 bg-white p-0.5"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-500">
              <Trophy className="h-3.5 w-3.5" />
            </div>
          )}
          <Link
            href={`/leagues/${league._id}`}
            className="font-medium text-slate-900 hover:text-emerald-700 hover:underline"
          >
            {league.name}
          </Link>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      render: (league) => <span>{league.country}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (league) => <StatusBadge leagueType={league.type} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (league) => (
        <div className="inline-flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild title="View league & seasons">
            <Link
              href={`/leagues/${league._id}`}
              aria-label={`View ${league.name}`}
            >
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit league"
            aria-label={`Edit ${league.name}`}
            onClick={() => {
              setEditingLeague(league);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete league"
            aria-label={`Delete ${league.name}`}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeletingLeague(league)}
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
          <h2 className="text-lg font-semibold text-slate-900">Leagues</h2>
          <p className="text-xs text-slate-500">
            Manage competitions, seasons, and standings tables.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingLeague(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create league
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search leagues..."
          className="w-full sm:w-64"
          ariaLabel="Search leagues"
        />
        <Input
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by country"
          aria-label="Filter leagues by country"
          className="w-full sm:w-44"
        />
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as LeagueType | '');
            setPage(1);
          }}
          aria-label="Filter by competition type"
          className="w-full sm:w-44"
        >
          <option value="">All types</option>
          <option value="league">League</option>
          <option value="cup">Cup</option>
          <option value="tournament">Tournament</option>
          <option value="friendly">Friendly</option>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : isError ? (
        <ErrorState
          title="Could not load leagues"
          message={error instanceof ApiClientError ? error.message : undefined}
          onRetry={() => refetch()}
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No leagues found"
          description={
            search || country || type
              ? 'No leagues match your current filters.'
              : 'Create a league to start organizing seasons and fixtures.'
          }
          action={
            !search && !country && !type ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditingLeague(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Create league
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            rowKey={(league) => league._id}
          />
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLeague(null);
        }}
        title={editingLeague ? `Edit ${editingLeague.name}` : 'Create league'}
      >
        <LeagueForm
          key={editingLeague?._id ?? 'new'}
          initialData={editingLeague}
          isSubmitting={createLeague.isPending || updateLeague.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSave}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deletingLeague)}
        onOpenChange={(open) => {
          if (!open) setDeletingLeague(null);
        }}
        title="Delete league"
        description={
          deletingLeague
            ? `Delete "${deletingLeague.name}"? Leagues with existing seasons or matches cannot be deleted.`
            : ''
        }
        confirmLabel="Delete league"
        isLoading={deleteLeague.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

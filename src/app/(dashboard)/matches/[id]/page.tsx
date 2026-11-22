'use client';

import {
  Activity,
  ArrowLeft,
  Ban,
  Clock,
  Flag,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { FormDialog } from '@/components/shared/form-dialog';
import {
  LoadingSkeleton,
  TableSkeleton,
} from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventForm } from '@/features/match-events/event-form';
import {
  useCreateMatchEvent,
  useDeleteMatchEvent,
  useMatchEvents,
  useUpdateMatchEvent,
} from '@/features/match-events/hooks';
import {
  useDeleteMatch,
  useMatch,
  useMatchLifecycleAction,
  useUpdateMatch,
  useUpdateMatchMinute,
  useUpdateMatchScore,
  type LifecycleAction,
} from '@/features/matches/hooks';
import { MatchForm } from '@/features/matches/match-form';
import { SimulationPanel } from '@/features/matches/simulation-panel';
import { ApiClientError } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type {
  CreateMatchEventPayload,
  CreateMatchPayload,
  MatchEvent,
} from '@/types/api';

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const matchId = params.id;

  const { data: match, isLoading, isError, error, refetch } = useMatch(matchId);
  const { data: events = [], isLoading: eventsLoading } =
    useMatchEvents(matchId);

  const updateMatch = useUpdateMatch();
  const deleteMatch = useDeleteMatch();
  const lifecycle = useMatchLifecycleAction();
  const updateMinute = useUpdateMatchMinute();
  const updateScore = useUpdateMatchScore();

  const createEvent = useCreateMatchEvent();
  const updateEvent = useUpdateMatchEvent();
  const deleteEvent = useDeleteMatchEvent();

  const [minuteInput, setMinuteInput] = useState('0');
  const [homeScoreInput, setHomeScoreInput] = useState('0');
  const [awayScoreInput, setAwayScoreInput] = useState('0');

  const [editMatchOpen, setEditMatchOpen] = useState(false);
  const [deleteMatchOpen, setDeleteMatchOpen] = useState(false);
  const [confirmLifecycle, setConfirmLifecycle] = useState<{
    action: LifecycleAction;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'default' | 'destructive' | 'warning';
  } | null>(null);

  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<MatchEvent | null>(null);

  useEffect(() => {
    if (match) {
      setMinuteInput(String(match.minute));
      setHomeScoreInput(String(match.homeScore));
      setAwayScoreInput(String(match.awayScore));
    }
  }, [match]);

  const runLifecycle = async (action: LifecycleAction) => {
    try {
      await lifecycle.mutateAsync({ id: matchId, action });
      toast.success(`Match updated (${action})`);
      setConfirmLifecycle(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : `Failed to ${action} match`,
      );
    }
  };

  const handleMinuteSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const minute = Number(minuteInput);
    if (Number.isNaN(minute) || minute < 0 || minute > 150) {
      toast.error('Minute must be between 0 and 150');
      return;
    }
    try {
      await updateMinute.mutateAsync({ id: matchId, minute });
      toast.success(`Updated match minute to ${minute}'`);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to update minute',
      );
    }
  };

  const handleScoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const homeScore = Number(homeScoreInput);
    const awayScore = Number(awayScoreInput);
    if (
      Number.isNaN(homeScore) ||
      Number.isNaN(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      toast.error('Scores must be non-negative integers');
      return;
    }
    try {
      await updateScore.mutateAsync({ id: matchId, homeScore, awayScore });
      toast.success(`Score updated to ${homeScore} - ${awayScore}`);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to update score',
      );
    }
  };

  const handleUpdateMatch = async (payload: CreateMatchPayload) => {
    try {
      await updateMatch.mutateAsync({ id: matchId, payload });
      toast.success('Match details updated');
      setEditMatchOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to update match',
      );
    }
  };

  const handleDeleteMatch = async () => {
    try {
      await deleteMatch.mutateAsync(matchId);
      toast.success('Match deleted');
      router.replace('/matches');
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete match',
      );
      setDeleteMatchOpen(false);
    }
  };

  const handleSaveEvent = async (payload: CreateMatchEventPayload) => {
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({
          matchId,
          eventId: editingEvent._id,
          payload,
        });
        toast.success('Match event updated');
      } else {
        await createEvent.mutateAsync({ matchId, payload });
        toast.success('Match event recorded');
      }
      setEventFormOpen(false);
      setEditingEvent(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to save event',
      );
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    try {
      await deleteEvent.mutateAsync({ matchId, eventId: deletingEvent._id });
      toast.success('Event removed and score synchronized');
      setDeletingEvent(null);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Failed to delete event',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-40 w-full" />
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  if (isError || !match) {
    return (
      <ErrorState
        title="Match not found"
        message={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  const canStart = match.status === 'scheduled' || match.status === 'postponed';
  const canHalftime = match.status === 'live';
  const canResume = match.status === 'halftime';
  const canFinish = match.status === 'live' || match.status === 'halftime';
  const canPostpone =
    match.status === 'scheduled' ||
    match.status === 'live' ||
    match.status === 'halftime';
  const canCancel =
    match.status !== 'finished' && match.status !== 'cancelled';
  const canEditMinute = match.status === 'live' || match.status === 'halftime';
  const canEditScore =
    match.status === 'live' ||
    match.status === 'halftime' ||
    match.status === 'finished';

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/matches">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to matches
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMatchOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit details
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteMatchOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete match
          </Button>
        </div>
      </div>

      {/* Scoreboard Panel */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-700">
              {match.league?.name}
            </span>
            <span>•</span>
            <span>{match.season?.name}</span>
            {match.round && (
              <>
                <span>•</span>
                <span>{match.round}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums">{formatDateTime(match.kickoff)}</span>
            {match.venue && <span>• {match.venue}</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4 py-6 text-center">
          <div className="space-y-1">
            <Link
              href={`/teams/${match.homeTeam._id}`}
              className="text-base font-semibold text-slate-900 hover:text-emerald-700 hover:underline sm:text-lg"
            >
              {match.homeTeam.name}
            </Link>
            <div className="text-xs font-medium text-slate-500">
              {match.homeTeam.shortName} • Home
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
              {match.homeScore} <span className="text-slate-300">-</span>{' '}
              {match.awayScore}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge matchStatus={match.status} />
              {(match.status === 'live' ||
                match.status === 'halftime' ||
                match.status === 'finished') && (
                <span className="text-xs font-semibold text-slate-700 tabular-nums">
                  {match.minute}&apos;
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Link
              href={`/teams/${match.awayTeam._id}`}
              className="text-base font-semibold text-slate-900 hover:text-emerald-700 hover:underline sm:text-lg"
            >
              {match.awayTeam.name}
            </Link>
            <div className="text-xs font-medium text-slate-500">
              {match.awayTeam.shortName} • Away
            </div>
          </div>
        </div>

        {/* Lifecycle Controls */}
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-2 text-xs font-semibold text-slate-600">
            Match lifecycle controls
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canStart && (
              <Button
                size="sm"
                disabled={lifecycle.isPending}
                onClick={() => runLifecycle('start')}
              >
                <Play className="h-3.5 w-3.5" />
                Start match
              </Button>
            )}
            {canHalftime && (
              <Button
                size="sm"
                variant="warning"
                disabled={lifecycle.isPending}
                onClick={() => runLifecycle('halftime')}
              >
                <Pause className="h-3.5 w-3.5" />
                Halftime
              </Button>
            )}
            {canResume && (
              <Button
                size="sm"
                disabled={lifecycle.isPending}
                onClick={() => runLifecycle('resume')}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Resume 2nd half
              </Button>
            )}
            {canFinish && (
              <Button
                size="sm"
                variant="secondary"
                disabled={lifecycle.isPending}
                onClick={() =>
                  setConfirmLifecycle({
                    action: 'finish',
                    title: 'Finish match',
                    description:
                      'Mark this match as finished? This locks further status changes and includes the result in league standings.',
                    confirmLabel: 'Finish match',
                    variant: 'default',
                  })
                }
              >
                <Flag className="h-3.5 w-3.5" />
                Finish match
              </Button>
            )}
            {canPostpone && (
              <Button
                size="sm"
                variant="outline"
                disabled={lifecycle.isPending}
                onClick={() => runLifecycle('postpone')}
              >
                <Clock className="h-3.5 w-3.5" />
                Postpone
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                disabled={lifecycle.isPending}
                onClick={() =>
                  setConfirmLifecycle({
                    action: 'cancel',
                    title: 'Cancel match',
                    description:
                      'Cancel this fixture? Cancelled matches cannot be restarted.',
                    confirmLabel: 'Cancel match',
                    variant: 'destructive',
                  })
                }
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel match
              </Button>
            )}

            {!canStart &&
              !canHalftime &&
              !canResume &&
              !canFinish &&
              !canPostpone &&
              !canCancel && (
                <span className="text-xs text-slate-500">
                  This match is in a terminal state ({match.status}).
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Simulation Engine Controls (Simulation Matches Only) */}
      {match.isSimulation && <SimulationPanel match={match} />}

      {/* Live Minute & Manual Score Controls */}
      {(canEditMinute || canEditScore) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {canEditMinute && (
            <form
              onSubmit={handleMinuteSave}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <Label htmlFor="live-minute">Update match minute (0–150)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="live-minute"
                  type="number"
                  min={0}
                  max={150}
                  value={minuteInput}
                  onChange={(e) => setMinuteInput(e.target.value)}
                  className="w-28 tabular-nums"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMinute.isPending}
                >
                  {updateMinute.isPending ? 'Saving...' : 'Update minute'}
                </Button>
              </div>
            </form>
          )}

          {canEditScore && (
            <form
              onSubmit={handleScoreSave}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <Label>Manual score override</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  aria-label="Home score"
                  value={homeScoreInput}
                  onChange={(e) => setHomeScoreInput(e.target.value)}
                  className="w-20 tabular-nums"
                />
                <span className="text-slate-400">-</span>
                <Input
                  type="number"
                  min={0}
                  aria-label="Away score"
                  value={awayScoreInput}
                  onChange={(e) => setAwayScoreInput(e.target.value)}
                  className="w-20 tabular-nums"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={updateScore.isPending}
                >
                  {updateScore.isPending ? 'Saving...' : 'Update score'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Match Events Timeline */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Match events
            </h3>
            <p className="text-xs text-slate-500">
              Goals, penalties, and own goals recalculate the score automatically.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingEvent(null);
              setEventFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add event
          </Button>
        </div>

        {eventsLoading ? (
          <div className="p-4">
            <TableSkeleton rows={3} columns={4} />
          </div>
        ) : events.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Activity}
              title="No events recorded"
              description="Record goals, penalties, own goals, cards, or substitutions for this match."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingEvent(null);
                    setEventFormOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add event
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((ev) => {
              const minuteLabel =
                ev.addedTime > 0
                  ? `${ev.minute}+${ev.addedTime}'`
                  : `${ev.minute}'`;
              const isHome = ev.team?._id === match.homeTeam._id;

              return (
                <div
                  key={ev._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-14 shrink-0 rounded bg-slate-100 px-2 py-1 text-center text-xs font-bold text-slate-800 tabular-nums">
                      {minuteLabel}
                    </span>
                    <StatusBadge eventType={ev.type} />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">
                        {ev.type === 'substitution'
                          ? `${ev.playerIn} (in) / ${ev.playerOut} (out)`
                          : ev.player || ev.description || ev.type}
                      </div>
                      <div className="text-xs text-slate-500">
                        {ev.team?.name} ({isHome ? 'Home' : 'Away'})
                        {ev.description && ev.player
                          ? ` • ${ev.description}`
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit event"
                      onClick={() => {
                        setEditingEvent(ev);
                        setEventFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete event"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeletingEvent(ev)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dialogs */}
      <FormDialog
        open={editMatchOpen}
        onOpenChange={setEditMatchOpen}
        title="Edit match details"
      >
        <MatchForm
          initialData={match}
          isSubmitting={updateMatch.isPending}
          onCancel={() => setEditMatchOpen(false)}
          onSubmit={handleUpdateMatch}
        />
      </FormDialog>

      <FormDialog
        open={eventFormOpen}
        onOpenChange={(open) => {
          setEventFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        title={editingEvent ? 'Edit match event' : 'Record match event'}
      >
        <EventForm
          key={editingEvent?._id ?? 'new'}
          match={match}
          initialData={editingEvent}
          isSubmitting={createEvent.isPending || updateEvent.isPending}
          onCancel={() => setEventFormOpen(false)}
          onSubmit={handleSaveEvent}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteMatchOpen}
        onOpenChange={setDeleteMatchOpen}
        title="Delete match"
        description={`Delete ${match.homeTeam.name} vs ${match.awayTeam.name} and all of its match events?`}
        confirmLabel="Delete match"
        isLoading={deleteMatch.isPending}
        onConfirm={handleDeleteMatch}
      />

      <ConfirmDialog
        open={Boolean(confirmLifecycle)}
        onOpenChange={(open) => {
          if (!open) setConfirmLifecycle(null);
        }}
        title={confirmLifecycle?.title ?? ''}
        description={confirmLifecycle?.description ?? ''}
        confirmLabel={confirmLifecycle?.confirmLabel ?? 'Confirm'}
        variant={confirmLifecycle?.variant ?? 'default'}
        isLoading={lifecycle.isPending}
        onConfirm={() => {
          if (confirmLifecycle) return runLifecycle(confirmLifecycle.action);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingEvent)}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null);
        }}
        title="Delete match event"
        description="Remove this event? If it was a goal, penalty, or own goal, the match score will be recalculated automatically."
        confirmLabel="Delete event"
        isLoading={deleteEvent.isPending}
        onConfirm={handleDeleteEvent}
      />
    </div>
  );
}

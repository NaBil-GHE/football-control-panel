'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Cpu,
  FastForward,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  matchKeys,
  useAdvanceSimulation,
  useChangeSimulationSpeed,
  usePauseSimulation,
  useResetSimulation,
  useResumeSimulation,
  useSimulationState,
  useStartSimulation,
  useStopSimulation,
} from '@/features/matches/hooks';
import { ApiClientError } from '@/lib/api-client';
import type { Match, MatchEvent, SimulationStatus } from '@/types/api';

const SIM_STATUS_TONES: Record<
  SimulationStatus,
  {
    label: string;
    tone: 'slate' | 'green' | 'amber' | 'blue' | 'red';
    pulse?: boolean;
  }
> = {
  idle: { label: 'Idle', tone: 'slate' },
  running: { label: 'Running', tone: 'green', pulse: true },
  paused: { label: 'Paused', tone: 'amber' },
  completed: { label: 'Completed', tone: 'blue' },
  stopped: { label: 'Stopped', tone: 'red' },
};

interface SimulationPanelProps {
  match: Match;
  events: MatchEvent[];
}

export function SimulationPanel({ match, events }: SimulationPanelProps) {
  const matchId = match._id;
  const qc = useQueryClient();

  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const {
    data: sim,
    isError,
    error,
    isFetching,
    refetch,
  } = useSimulationState(matchId, Boolean(match.isSimulation));

  const startSim = useStartSimulation(matchId);
  const pauseSim = usePauseSimulation(matchId);
  const resumeSim = useResumeSimulation(matchId);
  const changeSpeed = useChangeSimulationSpeed(matchId);
  const advanceSim = useAdvanceSimulation(matchId);
  const stopSim = useStopSimulation(matchId);
  const resetSim = useResetSimulation(matchId);

  const executedSteps = sim?.progress.executedSteps ?? 0;
  const prevExecutedRef = useRef<number>(executedSteps);

  // Only refresh match & events when simulation actually advances a step or changes state
  useEffect(() => {
    if (!sim) return;
    if (prevExecutedRef.current !== executedSteps) {
      prevExecutedRef.current = executedSteps;
      qc.setQueryData(matchKeys.detail(matchId), sim.match);
      qc.invalidateQueries({ queryKey: matchKeys.events(matchId) });
    }
  }, [executedSteps, matchId, qc, sim]);

  const status: SimulationStatus =
    sim?.simulationStatus ?? match.simulationStatus ?? 'idle';
  const speed = sim?.simulationSpeed ?? match.simulationSpeed ?? 10;
  const totalSteps = sim?.progress.totalSteps ?? 0;
  const progressPct =
    totalSteps > 0 ? Math.round((executedSteps / totalSteps) * 100) : 0;
  const statusMeta = SIM_STATUS_TONES[status];

  const isTerminal = status === 'completed' || status === 'stopped';
  const isBusy =
    startSim.isPending ||
    pauseSim.isPending ||
    resumeSim.isPending ||
    changeSpeed.isPending ||
    advanceSim.isPending ||
    stopSim.isPending ||
    resetSim.isPending;

  const recentEvents = events.slice(-4).reverse();

  const handleAction = async (
    fn: () => Promise<unknown>,
    successMsg: string,
  ) => {
    try {
      await fn();
      toast.success(successMsg);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : 'Simulation action failed',
      );
    }
  };

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            Simulation console
          </h3>
          {isError ? (
            <StatusBadge label="Error" tone="red" />
          ) : (
            <StatusBadge
              label={statusMeta.label}
              tone={statusMeta.tone}
              pulse={statusMeta.pulse}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 tabular-nums">
            {match.homeScore} - {match.awayScore} ({match.minute}&apos;)
          </span>
          {sim?.simulationSeed && (
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px]">
              Seed: {sim.simulationSeed}
            </span>
          )}
        </div>
      </div>

      {/* Polling error recovery banner */}
      {isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof ApiClientError
              ? error.message
              : 'Lost connection while polling simulation state.'}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => refetch()}
            className="h-7 border-red-300 text-red-800 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      {/* Progress & Next Event */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="tabular-nums font-medium">
            Progress: {executedSteps} / {totalSteps} steps ({progressPct}%)
          </span>
          {sim?.progress.nextStep && !isTerminal && (
            <span>
              Next:{' '}
              <span className="font-semibold text-slate-800">
                {sim.progress.nextStep.kind === 'event'
                  ? sim.progress.nextStep.eventType?.replace('_', ' ')
                  : sim.progress.nextStep.kind.replace('_', ' ')}{' '}
                ({sim.progress.nextStep.minute}
                {sim.progress.nextStep.addedTime > 0
                  ? `+${sim.progress.nextStep.addedTime}`
                  : ''}
                &apos;)
              </span>
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {status === 'idle' && (
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() =>
              handleAction(() => startSim.mutateAsync({}), 'Simulation started')
            }
          >
            <Play className="h-3.5 w-3.5" />
            {startSim.isPending ? 'Starting...' : 'Start'}
          </Button>
        )}

        {status === 'running' && (
          <Button
            size="sm"
            variant="warning"
            disabled={isBusy}
            onClick={() =>
              handleAction(() => pauseSim.mutateAsync(), 'Simulation paused')
            }
          >
            <Pause className="h-3.5 w-3.5" />
            {pauseSim.isPending ? 'Pausing...' : 'Pause'}
          </Button>
        )}

        {status === 'paused' && (
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() =>
              handleAction(() => resumeSim.mutateAsync(), 'Simulation resumed')
            }
          >
            <Play className="h-3.5 w-3.5" />
            {resumeSim.isPending ? 'Resuming...' : 'Resume'}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={isBusy || isTerminal}
          onClick={() =>
            handleAction(
              () => advanceSim.mutateAsync(),
              'Advanced to next event',
            )
          }
        >
          <FastForward className="h-3.5 w-3.5" />
          {advanceSim.isPending ? 'Advancing...' : 'Next event'}
        </Button>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="sim-live-speed"
            className="text-xs font-medium text-slate-600"
          >
            Speed:
          </label>
          <Select
            id="sim-live-speed"
            value={String(speed)}
            disabled={isBusy || isTerminal}
            onChange={(e) => {
              const nextSpeed = Number(e.target.value);
              void handleAction(
                () => changeSpeed.mutateAsync(nextSpeed),
                `Simulation speed set to ${nextSpeed}x`,
              );
            }}
            className="h-8 w-24 text-xs"
          >
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="30">30x</option>
            <option value="60">60x</option>
            <option value="120">120x</option>
          </Select>
        </div>

        {(status === 'running' || status === 'paused') && (
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            disabled={isBusy}
            onClick={() => setConfirmStop(true)}
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={isBusy}
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Config Summary & Recent Events */}
      <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-3 md:grid-cols-2">
        {sim?.simulationConfig && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-600">
              Configuration
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600 tabular-nums">
              <span className="rounded bg-slate-100 px-2 py-0.5">
                Duration: {sim.simulationConfig.matchDuration}m
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                Target events: {sim.simulationConfig.eventFrequency}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                Goals: {Math.round(sim.simulationConfig.goalProbability * 100)}%
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                Cards: {Math.round(sim.simulationConfig.cardProbability * 100)}%
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                Subs:{' '}
                {Math.round(sim.simulationConfig.substitutionProbability * 100)}%
                (max {sim.simulationConfig.maxSubstitutionsPerTeam}/team)
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-600">
            Recent events
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-slate-400">
              No events generated yet. Start or step the simulation.
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-700">
              {recentEvents.map((ev) => (
                <li
                  key={ev._id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    <span className="font-semibold tabular-nums">
                      {ev.minute}
                      {ev.addedTime > 0 ? `+${ev.addedTime}` : ''}&apos;
                    </span>{' '}
                    {ev.type.replace('_', ' ')} —{' '}
                    {ev.type === 'substitution'
                      ? `${ev.playerIn} / ${ev.playerOut}`
                      : ev.player || ev.description}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {ev.team?.shortName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmStop}
        onOpenChange={setConfirmStop}
        title="Stop simulation"
        description="Stop this simulation and cancel the match? Stopped simulations are excluded from league standings."
        confirmLabel="Stop & cancel match"
        variant="destructive"
        isLoading={stopSim.isPending}
        onConfirm={async () => {
          await handleAction(
            () => stopSim.mutateAsync(),
            'Simulation stopped and match cancelled',
          );
          setConfirmStop(false);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset simulation"
        description="Reset this match back to scheduled 0-0 and delete all recorded events?"
        confirmLabel="Reset simulation"
        variant="warning"
        isLoading={resetSim.isPending}
        onConfirm={async () => {
          await handleAction(
            () => resetSim.mutateAsync({}),
            'Simulation reset to scheduled 0-0',
          );
          setConfirmReset(false);
        }}
      />
    </section>
  );
}

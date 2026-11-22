'use client';

import {
  Cpu,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Square,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import type { Match, SimulationStatus } from '@/types/api';

const SIM_STATUS_TONES: Record<
  SimulationStatus,
  { label: string; tone: 'slate' | 'green' | 'amber' | 'blue'; pulse?: boolean }
> = {
  idle: { label: 'Simulation idle', tone: 'slate' },
  running: { label: 'Simulating live', tone: 'green', pulse: true },
  paused: { label: 'Simulation paused', tone: 'amber' },
  completed: { label: 'Simulation completed', tone: 'blue' },
};

export function SimulationPanel({ match }: { match: Match }) {
  const matchId = match._id;
  const qc = useQueryClient();

  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const { data: sim } = useSimulationState(matchId, Boolean(match.isSimulation));

  const startSim = useStartSimulation(matchId);
  const pauseSim = usePauseSimulation(matchId);
  const resumeSim = useResumeSimulation(matchId);
  const changeSpeed = useChangeSimulationSpeed(matchId);
  const advanceSim = useAdvanceSimulation(matchId);
  const stopSim = useStopSimulation(matchId);
  const resetSim = useResetSimulation(matchId);

  const executedSteps = sim?.progress.executedSteps ?? 0;

  // Whenever simulation advances a step while polling, refresh match score & events timeline
  useEffect(() => {
    if (!sim) return;
    qc.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    qc.invalidateQueries({ queryKey: matchKeys.events(matchId) });
  }, [executedSteps, sim?.simulationStatus, matchId, qc, sim]);

  const status: SimulationStatus =
    sim?.simulationStatus ?? match.simulationStatus ?? 'idle';
  const speed = sim?.simulationSpeed ?? match.simulationSpeed ?? 10;
  const totalSteps = sim?.progress.totalSteps ?? 0;
  const progressPct =
    totalSteps > 0 ? Math.round((executedSteps / totalSteps) * 100) : 0;
  const statusMeta = SIM_STATUS_TONES[status];

  const isBusy =
    startSim.isPending ||
    pauseSim.isPending ||
    resumeSim.isPending ||
    changeSpeed.isPending ||
    advanceSim.isPending ||
    stopSim.isPending ||
    resetSim.isPending;

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
    <section className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            Match simulation engine
          </h3>
          <StatusBadge
            label={statusMeta.label}
            tone={statusMeta.tone}
            pulse={statusMeta.pulse}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {sim?.simulationSeed && (
            <span className="rounded bg-white px-2 py-0.5 border border-slate-200 font-mono">
              Seed: {sim.simulationSeed}
            </span>
          )}
          <span className="tabular-nums font-medium">
            {executedSteps} / {totalSteps} steps ({progressPct}%)
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Next scheduled step preview */}
      {sim?.progress.nextStep && status !== 'completed' && (
        <div className="text-xs text-slate-600">
          Next scheduled step:{' '}
          <span className="font-semibold text-slate-800">
            {sim.progress.nextStep.kind === 'event'
              ? `${sim.progress.nextStep.eventType?.replace('_', ' ')}`
              : sim.progress.nextStep.kind.replace('_', ' ')}{' '}
            at {sim.progress.nextStep.minute}
            {sim.progress.nextStep.addedTime > 0
              ? `+${sim.progress.nextStep.addedTime}`
              : ''}
            &apos;
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {status === 'idle' && (
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() =>
              handleAction(() => startSim.mutateAsync({}), 'Simulation started')
            }
          >
            <Play className="h-3.5 w-3.5" />
            Start simulation
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
            Pause
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
            Resume
          </Button>
        )}

        {status !== 'completed' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() =>
              handleAction(
                () => advanceSim.mutateAsync(),
                'Advanced to next event',
              )
            }
          >
            <FastForward className="h-3.5 w-3.5" />
            Next event
          </Button>
        )}

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
            disabled={isBusy || status === 'completed'}
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

      <ConfirmDialog
        open={confirmStop}
        onOpenChange={setConfirmStop}
        title="Stop simulation"
        description="Stop the active simulation and mark this match as finished?"
        confirmLabel="Stop & finish"
        variant="destructive"
        isLoading={stopSim.isPending}
        onConfirm={async () => {
          await handleAction(() => stopSim.mutateAsync(), 'Simulation stopped');
          setConfirmStop(false);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset simulation"
        description="Reset this match back to scheduled 0-0 and delete all simulated events?"
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

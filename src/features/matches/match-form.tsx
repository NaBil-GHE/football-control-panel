'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useLeagues, useLeagueSeasons } from '@/features/leagues/hooks';
import { useTeams } from '@/features/teams/hooks';
import { toDateTimeLocalValue } from '@/lib/utils';
import type { CreateMatchPayload, Match } from '@/types/api';

const matchFormSchema = z
  .object({
    league: z.string().min(1, 'Select a league'),
    season: z.string().min(1, 'Select a season'),
    homeTeam: z.string().min(1, 'Select home team'),
    awayTeam: z.string().min(1, 'Select away team'),
    kickoff: z.string().min(1, 'Kickoff date and time is required'),
    venue: z.string().trim().max(150),
    round: z.string().trim().max(60),
    isSimulation: z.boolean(),
    simulationSpeed: z.coerce.number().min(1).max(120),
    simulationSeed: z
      .string()
      .trim()
      .max(120)
      .refine(
        (v) => v === '' || /^[a-zA-Z0-9._:-]+$/.test(v),
        'Seed may only contain letters, numbers, dots, underscores, colons, and hyphens',
      ),
    matchDuration: z.coerce.number().int().min(10).max(120),
    eventFrequency: z.coerce.number().int().min(2).max(30),
    goalProbability: z.coerce.number().min(0).max(1),
    cardProbability: z.coerce.number().min(0).max(1),
    substitutionProbability: z.coerce.number().min(0).max(1),
    maxSubstitutionsPerTeam: z.coerce.number().int().min(0).max(7),
  })
  .refine((data) => data.homeTeam !== data.awayTeam, {
    message: 'Home team and away team must be different',
    path: ['awayTeam'],
  })
  .refine(
    (data) =>
      !data.isSimulation ||
      data.goalProbability +
        data.cardProbability +
        data.substitutionProbability <=
        1.0001,
    {
      message: 'Goal + card + substitution probabilities cannot exceed 1.0',
      path: ['goalProbability'],
    },
  )
  .refine(
    (data) => !data.isSimulation || data.eventFrequency <= data.matchDuration,
    {
      message: 'Target events cannot exceed match duration',
      path: ['eventFrequency'],
    },
  );

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
  initialData?: Match | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateMatchPayload) => Promise<void>;
}

export function MatchForm({
  initialData,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: MatchFormProps) {
  const { data: leaguesData } = useLeagues({ page: 1, limit: 100 });
  const { data: teamsData } = useTeams({ page: 1, limit: 100 });

  const isSimulationLocked = Boolean(
    initialData?.isSimulation &&
      (initialData.simulationStatus === 'running' ||
        initialData.simulationStatus === 'paused'),
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      league: initialData?.league?._id ?? '',
      season: initialData?.season?._id ?? '',
      homeTeam: initialData?.homeTeam?._id ?? '',
      awayTeam: initialData?.awayTeam?._id ?? '',
      kickoff: toDateTimeLocalValue(initialData?.kickoff),
      venue: initialData?.venue ?? '',
      round: initialData?.round ?? '',
      isSimulation: initialData?.isSimulation ?? false,
      simulationSpeed: initialData?.simulationSpeed ?? 10,
      simulationSeed: initialData?.simulationSeed ?? '',
      matchDuration: initialData?.simulationConfig?.matchDuration ?? 90,
      eventFrequency: initialData?.simulationConfig?.eventFrequency ?? 12,
      goalProbability: initialData?.simulationConfig?.goalProbability ?? 0.22,
      cardProbability: initialData?.simulationConfig?.cardProbability ?? 0.38,
      substitutionProbability:
        initialData?.simulationConfig?.substitutionProbability ?? 0.32,
      maxSubstitutionsPerTeam:
        initialData?.simulationConfig?.maxSubstitutionsPerTeam ?? 5,
    },
  });

  const selectedLeagueId = watch('league');
  const selectedHomeTeamId = watch('homeTeam');
  const selectedSeasonId = watch('season');
  const isSimulation = watch('isSimulation');

  const { data: seasons = [] } = useLeagueSeasons(selectedLeagueId);

  useEffect(() => {
    if (!selectedLeagueId) return;
    if (seasons.length > 0 && !seasons.some((s) => s._id === selectedSeasonId)) {
      const active = seasons.find((s) => s.current) ?? seasons[0];
      if (active) {
        setValue('season', active._id);
      }
    }
  }, [selectedLeagueId, seasons, selectedSeasonId, setValue]);

  const leagues = leaguesData?.data ?? [];
  const teams = teamsData?.data ?? [];

  const handleFormSubmit = async (values: MatchFormValues) => {
    const kickoffDate = new Date(values.kickoff);
    const payload: CreateMatchPayload = {
      league: values.league,
      season: values.season,
      homeTeam: values.homeTeam,
      awayTeam: values.awayTeam,
      kickoff: kickoffDate.toISOString(),
      ...(values.venue ? { venue: values.venue } : {}),
      ...(values.round ? { round: values.round } : {}),
    };

    if (!isSimulationLocked) {
      payload.isSimulation = values.isSimulation;
      if (values.isSimulation) {
        payload.simulationSpeed = values.simulationSpeed;
        if (values.simulationSeed) {
          payload.simulationSeed = values.simulationSeed;
        }
        payload.simulationConfig = {
          matchDuration: values.matchDuration,
          eventFrequency: values.eventFrequency,
          goalProbability: values.goalProbability,
          cardProbability: values.cardProbability,
          substitutionProbability: values.substitutionProbability,
          maxSubstitutionsPerTeam: values.maxSubstitutionsPerTeam,
        };
      }
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="match-league">League *</Label>
          <Select id="match-league" {...register('league')}>
            <option value="">Select league</option>
            {leagues.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name} ({l.country})
              </option>
            ))}
          </Select>
          {errors.league && (
            <p className="mt-1 text-xs text-red-600">{errors.league.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="match-season">Season *</Label>
          <Select
            id="match-season"
            disabled={!selectedLeagueId || seasons.length === 0}
            {...register('season')}
          >
            <option value="">
              {!selectedLeagueId
                ? 'Select a league first'
                : seasons.length === 0
                  ? 'No seasons in this league'
                  : 'Select season'}
            </option>
            {seasons.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.current ? '(Current)' : ''}
              </option>
            ))}
          </Select>
          {errors.season && (
            <p className="mt-1 text-xs text-red-600">{errors.season.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="match-home">Home team *</Label>
          <Select id="match-home" {...register('homeTeam')}>
            <option value="">Select home team</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.shortName})
              </option>
            ))}
          </Select>
          {errors.homeTeam && (
            <p className="mt-1 text-xs text-red-600">
              {errors.homeTeam.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="match-away">Away team *</Label>
          <Select id="match-away" {...register('awayTeam')}>
            <option value="">Select away team</option>
            {teams.map((t) => (
              <option
                key={t._id}
                value={t._id}
                disabled={t._id === selectedHomeTeamId}
              >
                {t.name} ({t.shortName})
              </option>
            ))}
          </Select>
          {errors.awayTeam && (
            <p className="mt-1 text-xs text-red-600">
              {errors.awayTeam.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="match-kickoff">Kickoff (local time, saved as UTC) *</Label>
        <Input
          id="match-kickoff"
          type="datetime-local"
          {...register('kickoff')}
        />
        {errors.kickoff && (
          <p className="mt-1 text-xs text-red-600">{errors.kickoff.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="match-venue">Venue</Label>
          <Input
            id="match-venue"
            placeholder="Santiago Bernabeu"
            {...register('venue')}
          />
        </div>

        <div>
          <Label htmlFor="match-round">Round</Label>
          <Input
            id="match-round"
            placeholder="Matchday 12"
            {...register('round')}
          />
        </div>
      </div>

      {/* Simulation Mode Configuration */}
      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            disabled={isSimulationLocked}
            className="h-4 w-4 rounded border-slate-300 accent-emerald-700"
            {...register('isSimulation')}
          />
          <span>Enable Match Simulation Mode</span>
        </label>

        {isSimulationLocked && (
          <p className="text-xs text-amber-700">
            Simulation settings are locked while the simulation is{' '}
            {initialData?.simulationStatus}. Reset the simulation from match
            details to edit these parameters.
          </p>
        )}

        {isSimulation && (
          <div className="space-y-3 pt-1 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sim-speed">Speed (1x–120x)</Label>
                <Select
                  id="sim-speed"
                  disabled={isSimulationLocked}
                  {...register('simulationSpeed')}
                >
                  <option value={1}>1x (Slow)</option>
                  <option value={2}>2x</option>
                  <option value={5}>5x</option>
                  <option value={10}>10x (Default)</option>
                  <option value={30}>30x (Fast)</option>
                  <option value={60}>60x (Very fast)</option>
                  <option value={120}>120x (Max)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="sim-seed">Deterministic seed</Label>
                <Input
                  id="sim-seed"
                  disabled={isSimulationLocked}
                  placeholder="Auto-generated if empty"
                  {...register('simulationSeed')}
                />
                {errors.simulationSeed && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.simulationSeed.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label htmlFor="sim-duration">Duration (min)</Label>
                <Input
                  id="sim-duration"
                  type="number"
                  min={10}
                  max={120}
                  disabled={isSimulationLocked}
                  {...register('matchDuration')}
                />
              </div>
              <div>
                <Label htmlFor="sim-freq">Events (2–30)</Label>
                <Input
                  id="sim-freq"
                  type="number"
                  min={2}
                  max={30}
                  disabled={isSimulationLocked}
                  {...register('eventFrequency')}
                />
              </div>
              <div>
                <Label htmlFor="sim-max-subs">Max subs/team</Label>
                <Input
                  id="sim-max-subs"
                  type="number"
                  min={0}
                  max={7}
                  disabled={isSimulationLocked}
                  {...register('maxSubstitutionsPerTeam')}
                />
              </div>
            </div>
            {errors.eventFrequency && (
              <p className="text-xs text-red-600">
                {errors.eventFrequency.message}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label htmlFor="sim-goal-p">Goal prob.</Label>
                <Input
                  id="sim-goal-p"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  disabled={isSimulationLocked}
                  {...register('goalProbability')}
                />
              </div>
              <div>
                <Label htmlFor="sim-card-p">Card prob.</Label>
                <Input
                  id="sim-card-p"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  disabled={isSimulationLocked}
                  {...register('cardProbability')}
                />
              </div>
              <div>
                <Label htmlFor="sim-sub-p">Sub prob.</Label>
                <Input
                  id="sim-sub-p"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  disabled={isSimulationLocked}
                  {...register('substitutionProbability')}
                />
              </div>
            </div>
            {errors.goalProbability && (
              <p className="text-xs text-red-600">
                {errors.goalProbability.message}
              </p>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Save changes'
              : 'Create match'}
        </Button>
      </DialogFooter>
    </form>
  );
}

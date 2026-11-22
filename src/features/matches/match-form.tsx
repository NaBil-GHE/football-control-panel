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
  })
  .refine((data) => data.homeTeam !== data.awayTeam, {
    message: 'Home team and away team must be different',
    path: ['awayTeam'],
  });

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
    },
  });

  const selectedLeagueId = watch('league');
  const selectedHomeTeamId = watch('homeTeam');
  const selectedSeasonId = watch('season');

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
    await onSubmit({
      league: values.league,
      season: values.season,
      homeTeam: values.homeTeam,
      awayTeam: values.awayTeam,
      kickoff: kickoffDate.toISOString(),
      ...(values.venue ? { venue: values.venue } : {}),
      ...(values.round ? { round: values.round } : {}),
    });
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

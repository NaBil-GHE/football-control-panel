'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  MATCH_EVENT_TYPES,
  type CreateMatchEventPayload,
  type Match,
  type MatchEvent,
} from '@/types/api';

const PLAYER_REQUIRED_TYPES = new Set([
  'goal',
  'own_goal',
  'penalty',
  'yellow_card',
  'red_card',
]);

const eventFormSchema = z
  .object({
    team: z.string().min(1, 'Select a team'),
    type: z.enum(MATCH_EVENT_TYPES),
    minute: z.coerce.number().int().min(0, 'Min 0').max(150, 'Max 150'),
    addedTime: z.coerce.number().int().min(0, 'Min 0').max(30, 'Max 30'),
    player: z.string().trim().max(100),
    playerIn: z.string().trim().max(100),
    playerOut: z.string().trim().max(100),
    description: z.string().trim().max(500),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'substitution') {
      if (!data.playerIn) {
        ctx.addIssue({
          code: 'custom',
          path: ['playerIn'],
          message: 'Player in is required for substitutions',
        });
      }
      if (!data.playerOut) {
        ctx.addIssue({
          code: 'custom',
          path: ['playerOut'],
          message: 'Player out is required for substitutions',
        });
      }
      if (
        data.playerIn &&
        data.playerOut &&
        data.playerIn.toLowerCase() === data.playerOut.toLowerCase()
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['playerIn'],
          message: 'Player in and player out must be different',
        });
      }
    }

    if (PLAYER_REQUIRED_TYPES.has(data.type) && !data.player) {
      ctx.addIssue({
        code: 'custom',
        path: ['player'],
        message: 'Player name is required for this event type',
      });
    }
  });

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  match: Match;
  initialData?: MatchEvent | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateMatchEventPayload) => Promise<void>;
}

export function EventForm({
  match,
  initialData,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: EventFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      team: initialData?.team?._id ?? match.homeTeam._id,
      type: initialData?.type ?? 'goal',
      minute: initialData?.minute ?? Math.max(match.minute, 1),
      addedTime: initialData?.addedTime ?? 0,
      player: initialData?.player ?? '',
      playerIn: initialData?.playerIn ?? '',
      playerOut: initialData?.playerOut ?? '',
      description: initialData?.description ?? '',
    },
  });

  const eventType = watch('type');
  const isSubstitution = eventType === 'substitution';
  const requiresPlayer = PLAYER_REQUIRED_TYPES.has(eventType);

  const handleFormSubmit = async (values: EventFormValues) => {
    await onSubmit({
      team: values.team,
      type: values.type,
      minute: values.minute,
      addedTime: values.addedTime,
      ...(values.player ? { player: values.player } : {}),
      ...(values.playerIn ? { playerIn: values.playerIn } : {}),
      ...(values.playerOut ? { playerOut: values.playerOut } : {}),
      ...(values.description ? { description: values.description } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="event-team">Team *</Label>
          <Select id="event-team" {...register('team')}>
            <option value={match.homeTeam._id}>
              {match.homeTeam.name} (Home)
            </option>
            <option value={match.awayTeam._id}>
              {match.awayTeam.name} (Away)
            </option>
          </Select>
          {errors.team && (
            <p className="mt-1 text-xs text-red-600">{errors.team.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="event-type">Event type *</Label>
          <Select id="event-type" {...register('type')}>
            <option value="goal">Goal</option>
            <option value="penalty">Penalty</option>
            <option value="own_goal">Own goal</option>
            <option value="yellow_card">Yellow card</option>
            <option value="red_card">Red card</option>
            <option value="substitution">Substitution</option>
            <option value="injury">Injury</option>
            <option value="var">VAR</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event-minute">Minute *</Label>
          <Input
            id="event-minute"
            type="number"
            min={0}
            max={150}
            {...register('minute')}
          />
          {errors.minute && (
            <p className="mt-1 text-xs text-red-600">{errors.minute.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="event-added">Added time (+)</Label>
          <Input
            id="event-added"
            type="number"
            min={0}
            max={30}
            {...register('addedTime')}
          />
          {errors.addedTime && (
            <p className="mt-1 text-xs text-red-600">
              {errors.addedTime.message}
            </p>
          )}
        </div>
      </div>

      {isSubstitution ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="event-player-in">Player in *</Label>
            <Input
              id="event-player-in"
              placeholder="Luka Modric"
              {...register('playerIn')}
            />
            {errors.playerIn && (
              <p className="mt-1 text-xs text-red-600">
                {errors.playerIn.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="event-player-out">Player out *</Label>
            <Input
              id="event-player-out"
              placeholder="Eduardo Camavinga"
              {...register('playerOut')}
            />
            {errors.playerOut && (
              <p className="mt-1 text-xs text-red-600">
                {errors.playerOut.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="event-player">
            Player {requiresPlayer ? '*' : '(optional)'}
          </Label>
          <Input
            id="event-player"
            placeholder="Vinicius Jr"
            {...register('player')}
          />
          {errors.player && (
            <p className="mt-1 text-xs text-red-600">{errors.player.message}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          placeholder="Optional details about the event"
          {...register('description')}
        />
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
              : 'Record event'}
        </Button>
      </DialogFooter>
    </form>
  );
}

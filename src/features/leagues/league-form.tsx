'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  LEAGUE_TYPES,
  type CreateLeaguePayload,
  type League,
} from '@/types/api';

const leagueFormSchema = z.object({
  name: z.string().trim().min(2, 'League name must be at least 2 characters').max(120),
  country: z.string().trim().min(2, 'Country must be at least 2 characters').max(80),
  type: z.enum(LEAGUE_TYPES),
  logo: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || /^https?:\/\/.+/.test(val),
      'Logo must be a valid URL',
    ),
});

type LeagueFormValues = z.infer<typeof leagueFormSchema>;

interface LeagueFormProps {
  initialData?: League | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateLeaguePayload) => Promise<void>;
}

export function LeagueForm({
  initialData,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: LeagueFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeagueFormValues>({
    resolver: zodResolver(leagueFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      country: initialData?.country ?? '',
      type: initialData?.type ?? 'league',
      logo: initialData?.logo ?? '',
    },
  });

  const handleFormSubmit = async (values: LeagueFormValues) => {
    await onSubmit({
      name: values.name,
      country: values.country,
      type: values.type,
      ...(values.logo ? { logo: values.logo } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="league-name">League name *</Label>
        <Input
          id="league-name"
          placeholder="Premier League"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="league-country">Country / Region *</Label>
          <Input
            id="league-country"
            placeholder="England"
            {...register('country')}
          />
          {errors.country && (
            <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="league-type">Competition type *</Label>
          <Select id="league-type" {...register('type')}>
            <option value="league">League</option>
            <option value="cup">Cup</option>
            <option value="tournament">Tournament</option>
            <option value="friendly">Friendly</option>
          </Select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="league-logo">Logo URL</Label>
        <Input
          id="league-logo"
          type="url"
          placeholder="https://example.com/league.png"
          {...register('logo')}
        />
        {errors.logo && (
          <p className="mt-1 text-xs text-red-600">{errors.logo.message}</p>
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
              : 'Create league'}
        </Button>
      </DialogFooter>
    </form>
  );
}

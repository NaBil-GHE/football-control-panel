'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateTeamPayload, Team } from '@/types/api';

const currentYear = new Date().getUTCFullYear();

const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(120),
  shortName: z
    .string()
    .trim()
    .min(2, 'Short name must be at least 2 characters')
    .max(20),
  country: z
    .string()
    .trim()
    .min(2, 'Country must be at least 2 characters')
    .max(80),
  logo: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || /^https?:\/\/.+/.test(val),
      'Logo must be a valid URL (http:// or https://)',
    ),
  founded: z
    .string()
    .trim()
    .refine(
      (val) =>
        val === '' ||
        (/^\d{4}$/.test(val) &&
          Number(val) >= 1850 &&
          Number(val) <= currentYear + 1),
      `Founded year must be between 1850 and ${currentYear + 1}`,
    ),
  stadium: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || (val.length >= 2 && val.length <= 120),
      'Stadium must be 2–120 characters',
    ),
  description: z.string().trim().max(1000, 'Maximum 1000 characters'),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  initialData?: Team | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateTeamPayload) => Promise<void>;
}

export function TeamForm({
  initialData,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: TeamFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      shortName: initialData?.shortName ?? '',
      country: initialData?.country ?? '',
      logo: initialData?.logo ?? '',
      founded: initialData?.founded ? String(initialData.founded) : '',
      stadium: initialData?.stadium ?? '',
      description: initialData?.description ?? '',
    },
  });

  const handleFormSubmit = async (values: TeamFormValues) => {
    const payload: CreateTeamPayload = {
      name: values.name,
      shortName: values.shortName.toUpperCase(),
      country: values.country,
      ...(values.logo ? { logo: values.logo } : {}),
      ...(values.founded ? { founded: Number(values.founded) } : {}),
      ...(values.stadium ? { stadium: values.stadium } : {}),
      ...(values.description ? { description: values.description } : {}),
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="team-name">Team name *</Label>
          <Input id="team-name" placeholder="Real Madrid" {...register('name')} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="team-short">Short name *</Label>
          <Input
            id="team-short"
            placeholder="RMA"
            className="uppercase"
            {...register('shortName')}
          />
          {errors.shortName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.shortName.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="team-country">Country *</Label>
          <Input id="team-country" placeholder="Spain" {...register('country')} />
          {errors.country && (
            <p className="mt-1 text-xs text-red-600">
              {errors.country.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="team-founded">Founded year</Label>
          <Input
            id="team-founded"
            type="number"
            placeholder="1902"
            {...register('founded')}
          />
          {errors.founded && (
            <p className="mt-1 text-xs text-red-600">
              {errors.founded.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="team-stadium">Stadium</Label>
          <Input
            id="team-stadium"
            placeholder="Santiago Bernabeu"
            {...register('stadium')}
          />
          {errors.stadium && (
            <p className="mt-1 text-xs text-red-600">
              {errors.stadium.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="team-logo">Logo URL</Label>
          <Input
            id="team-logo"
            type="url"
            placeholder="https://example.com/logo.png"
            {...register('logo')}
          />
          {errors.logo && (
            <p className="mt-1 text-xs text-red-600">{errors.logo.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="team-description">Description</Label>
        <Textarea
          id="team-description"
          placeholder="Optional notes about the club"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
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
              : 'Create team'}
        </Button>
      </DialogFooter>
    </form>
  );
}

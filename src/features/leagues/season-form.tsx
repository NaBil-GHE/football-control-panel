'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toDateInputValue } from '@/lib/utils';
import type { CreateSeasonPayload, Season } from '@/types/api';

const seasonFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Season name must be at least 2 characters')
      .max(60),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    current: z.boolean(),
  })
  .refine(
    (data) =>
      new Date(`${data.endDate}T00:00:00.000Z`).getTime() >
      new Date(`${data.startDate}T00:00:00.000Z`).getTime(),
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

type SeasonFormValues = z.infer<typeof seasonFormSchema>;

interface SeasonFormProps {
  initialData?: Season | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateSeasonPayload) => Promise<void>;
}

export function SeasonForm({
  initialData,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: SeasonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      startDate: toDateInputValue(initialData?.startDate),
      endDate: toDateInputValue(initialData?.endDate),
      current: initialData?.current ?? false,
    },
  });

  const handleFormSubmit = async (values: SeasonFormValues) => {
    await onSubmit({
      name: values.name,
      startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${values.endDate}T23:59:59.000Z`).toISOString(),
      current: values.current,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="season-name">Season name *</Label>
        <Input
          id="season-name"
          placeholder="2025/2026"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="season-start">Start date (UTC) *</Label>
          <Input id="season-start" type="date" {...register('startDate')} />
          {errors.startDate && (
            <p className="mt-1 text-xs text-red-600">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="season-end">End date (UTC) *</Label>
          <Input id="season-end" type="date" {...register('endDate')} />
          {errors.endDate && (
            <p className="mt-1 text-xs text-red-600">
              {errors.endDate.message}
            </p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 accent-emerald-700"
          {...register('current')}
        />
        <span>Set as current active season for this league</span>
      </label>

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
              : 'Create season'}
        </Button>
      </DialogFooter>
    </form>
  );
}

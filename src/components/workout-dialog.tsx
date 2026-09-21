'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workoutSchema, MUSCLE_GROUPS, type MuscleGroup } from '@/lib/validations';
import { useCreateWorkout, useUpdateWorkout, type Workout } from '@/lib/hooks';
import { getTodayString } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { z } from 'zod';

type WorkoutForm = z.infer<typeof workoutSchema>;

interface WorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: Workout | null;
  defaultDate?: string;
}

export function WorkoutDialog({ open, onOpenChange, workout, defaultDate }: WorkoutDialogProps) {
  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const { t, getMuscleGroupLabel } = useLanguage();
  const [error, setError] = useState('');

  const isEditing = !!workout;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<WorkoutForm>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      date: defaultDate || getTodayString(),
      muscleGroups: [],
      note: '',
    },
  });

  const selectedMuscleGroups = watch('muscleGroups') || [];

  useEffect(() => {
    if (open) {
      if (workout) {
        reset({
          date: workout.date,
          muscleGroups: workout.muscleGroups as MuscleGroup[],
          note: workout.note || '',
        });
      } else {
        reset({
          date: defaultDate || getTodayString(),
          muscleGroups: [],
          note: '',
        });
      }
      setError('');
    }
  }, [open, workout, defaultDate, reset]);

  const toggleMuscleGroup = (group: MuscleGroup) => {
    const current = selectedMuscleGroups as MuscleGroup[];
    if (current.includes(group)) {
      setValue('muscleGroups', current.filter((g) => g !== group), { shouldValidate: true });
    } else {
      setValue('muscleGroups', [...current, group], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: WorkoutForm) => {
    setError('');
    try {
      if (isEditing && workout) {
        await updateWorkout.mutateAsync({ id: workout.id, ...data });
      } else {
        await createWorkout.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const isLoading = createWorkout.isPending || updateWorkout.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.workoutDialog.editTitle : t.workoutDialog.addTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t.workoutDialog.editDesc : t.workoutDialog.addDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">{t.workoutDialog.date}</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.workoutDialog.muscleGroups}</Label>
            <div className="grid grid-cols-2 gap-2">
              {MUSCLE_GROUPS.map((group) => (
                <label
                  key={group}
                  className="flex items-center gap-2 rounded-lg border border-input p-3 cursor-pointer hover:bg-accent transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox
                    checked={(selectedMuscleGroups as string[]).includes(group)}
                    onCheckedChange={() => toggleMuscleGroup(group)}
                  />
                  <span className="text-sm font-medium">{getMuscleGroupLabel(group)}</span>
                </label>
              ))}
            </div>
            {errors.muscleGroups && (
              <p className="text-sm text-destructive">{errors.muscleGroups.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t.workoutDialog.note}</Label>
            <Textarea
              id="note"
              placeholder={t.workoutDialog.notePlaceholder}
              {...register('note')}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.workoutDialog.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t.workoutDialog.saving
                : isEditing
                ? t.workoutDialog.update
                : t.workoutDialog.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

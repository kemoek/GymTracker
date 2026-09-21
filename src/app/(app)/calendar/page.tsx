'use client';

import { useState, useMemo } from 'react';
import { useWorkouts, useDeleteWorkout, type Workout } from '@/lib/hooks';
import { formatDate, getDateString } from '@/lib/utils';
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/lib/validations';
import { WorkoutDialog } from '@/components/workout-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Dumbbell, Pencil, Trash2 } from 'lucide-react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const deleteWorkout = useDeleteWorkout();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data: workouts, isLoading } = useWorkouts({ month: monthStr });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() || 7; // Monday = 1
    const totalDays = lastDay.getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        date: getDateString(d),
        day: d.getDate(),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: getDateString(d),
        day: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          date: getDateString(d),
          day: d.getDate(),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [year, month]);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, Workout[]>();
    workouts?.forEach((w) => {
      const existing = map.get(w.date) || [];
      map.set(w.date, [...existing, w]);
    });
    return map;
  }, [workouts]);

  const today = getDateString(new Date());
  const selectedDateWorkouts = selectedDate ? workoutsByDate.get(selectedDate) || [] : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDeleteWorkout = async (id: string) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      await deleteWorkout.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Button onClick={() => { setEditingWorkout(null); setWorkoutDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Workout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{monthName}</CardTitle>
              {monthStr !== getDateString(new Date()).slice(0, 7) && (
                <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ date, day, isCurrentMonth }) => {
                  const hasWorkout = workoutsByDate.has(date);
                  const isToday = date === today;
                  const isSelected = date === selectedDate;

                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date === selectedDate ? null : date)}
                      className={cn(
                        'relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors',
                        !isCurrentMonth && 'text-muted-foreground/40',
                        isCurrentMonth && 'hover:bg-accent',
                        isToday && 'font-bold',
                        isSelected && 'bg-accent ring-2 ring-primary',
                        hasWorkout && isCurrentMonth && 'font-semibold'
                      )}
                    >
                      <span>{day}</span>
                      {hasWorkout && isCurrentMonth && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{formatDate(selectedDate)}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingWorkout(null);
                  setWorkoutDialogOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateWorkouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No workouts on this day.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {workout.muscleGroups
                          .map((mg) => MUSCLE_GROUP_LABELS[mg as MuscleGroup] || mg)
                          .join(' + ')}
                      </p>
                      {workout.note && (
                        <p className="text-xs text-muted-foreground mt-1">{workout.note}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingWorkout(workout);
                          setWorkoutDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteWorkout(workout.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <WorkoutDialog
        open={workoutDialogOpen}
        onOpenChange={setWorkoutDialogOpen}
        workout={editingWorkout}
        defaultDate={selectedDate || undefined}
      />
    </div>
  );
}

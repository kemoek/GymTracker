'use client';

import { useState, useMemo } from 'react';
import { useRoutine, useUpdateRoutine, useApplyRoutinePreset, type RoutineDayItem } from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  Sparkles,
  Edit2,
  Coffee,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
} from 'lucide-react';

export default function RoutinePage() {
  const { data, isLoading } = useRoutine();
  const updateRoutine = useUpdateRoutine();
  const applyPreset = useApplyRoutinePreset();
  const { t, getMuscleGroupLabel, locale } = useLanguage();

  const [editingDay, setEditingDay] = useState<RoutineDayItem | null>(null);
  const [editIsRest, setEditIsRest] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editMuscles, setEditMuscles] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Today's day of week (1 = Monday, 7 = Sunday)
  const currentDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  const routineDays = useMemo(() => {
    const list: RoutineDayItem[] = [];
    const existing = data?.routine || [];
    for (let day = 1; day <= 7; day++) {
      const match = existing.find((r) => r.dayOfWeek === day);
      if (match) {
        list.push(match);
      } else {
        list.push({
          dayOfWeek: day,
          isRestDay: day >= 6,
          title: day >= 6 ? (locale === 'tr' ? 'Dinlenme' : 'Rest') : '',
          muscleGroups: [],
          notes: '',
        });
      }
    }
    return list;
  }, [data, locale]);

  const openEditor = (item: RoutineDayItem) => {
    setEditingDay(item);
    setEditIsRest(item.isRestDay);
    setEditTitle(item.title || '');
    setEditMuscles(item.muscleGroups || []);
    setEditNotes(item.notes || '');
  };

  const handleToggleMuscle = (group: string) => {
    if (editMuscles.includes(group)) {
      setEditMuscles(editMuscles.filter((g) => g !== group));
    } else {
      setEditMuscles([...editMuscles, group]);
    }
  };

  const handleSaveDay = async () => {
    if (!editingDay) return;

    const updatedList = routineDays.map((d) => {
      if (d.dayOfWeek === editingDay.dayOfWeek) {
        return {
          dayOfWeek: d.dayOfWeek,
          isRestDay: editIsRest,
          title: editIsRest ? (locale === 'tr' ? 'Dinlenme' : 'Rest') : editTitle.trim(),
          muscleGroups: editIsRest ? [] : editMuscles,
          notes: editNotes.trim(),
        };
      }
      return d;
    });

    try {
      await updateRoutine.mutateAsync({ days: updatedList });
      setMessage(t.routine.savedSuccess);
      setTimeout(() => setMessage(null), 3000);
      setEditingDay(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleApplyPreset = async (preset: 'ppl' | 'upper_lower' | 'bro_split' | 'full_body') => {
    try {
      await applyPreset.mutateAsync(preset);
      setMessage(t.routine.appliedSuccess);
      setTimeout(() => setMessage(null), 3000);
    } catch {
      // Error handled
    }
  };

  const presets = [
    {
      id: 'ppl' as const,
      name: 'Push / Pull / Legs (PPL)',
      desc: locale === 'tr' ? 'İtiş, Çekiş, Bacak döngüsü (6 gün antrenman, 1 gün dinlenme)' : 'Push, Pull, Legs cycle (6 days on, 1 day rest)',
      icon: Flame,
    },
    {
      id: 'upper_lower' as const,
      name: locale === 'tr' ? 'Üst / Alt Vücut (Upper/Lower)' : 'Upper / Lower Split',
      desc: locale === 'tr' ? 'Haftada 4 gün yoğun çalışma, 3 gün dinlenme' : '4 days upper/lower strength split, 3 days rest',
      icon: Layers,
    },
    {
      id: 'bro_split' as const,
      name: 'Bro Split (Tek Bölge)',
      desc: locale === 'tr' ? 'Her gün 1-2 ana kas grubu (Göğüs, Sırt, Omuz, Bacak, Kol)' : '1-2 major muscle groups per day (Chest, Back, Shoulders, Legs, Arms)',
      icon: Dumbbell,
    },
    {
      id: 'full_body' as const,
      name: 'Full Body (Tüm Vücut)',
      desc: locale === 'tr' ? 'Haftada 3 gün tüm vücut, aralarda dinlenme günleri' : '3 days whole body workouts with rest days in between',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            {t.routine.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t.routine.subtitle}
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {message && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Preset Templates Card */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            {t.routine.presetTemplates}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {locale === 'tr'
              ? 'Sıfırdan ayarlamak yerine tek tıkla popüler antrenman şablonlarından birini seçin ve özelleştirin.'
              : 'Choose one of the popular split templates with one click and customize it.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presets.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p.id)}
                  disabled={applyPreset.isPending}
                  className="flex flex-col text-left p-3.5 rounded-lg border border-border/70 hover:border-primary/50 hover:bg-accent/40 transition-all group relative disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1.5 font-medium text-sm group-hover:text-primary transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{p.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                  <span className="text-[11px] font-medium text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.routine.applyPreset} →
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Routine Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {locale === 'tr' ? 'Haftalık Akış (Pazartesi – Pazar)' : 'Weekly Schedule (Monday – Sunday)'}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl border border-border bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {routineDays.map((day) => {
              const isToday = day.dayOfWeek === currentDayOfWeek;
              const dayName = t.routine.daysLong[day.dayOfWeek - 1];

              return (
                <Card
                  key={day.dayOfWeek}
                  className={cn(
                    'relative border transition-all flex flex-col justify-between overflow-hidden',
                    isToday
                      ? 'border-primary shadow-md bg-card ring-1 ring-primary/40'
                      : 'border-border/70 bg-card/50 hover:border-border'
                  )}
                >
                  {isToday && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl">
                      {t.routine.today}
                    </div>
                  )}

                  <CardHeader className="p-3.5 pb-2">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-semibold', isToday && 'text-primary')}>
                        {dayName}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3.5 pt-0 flex-1 flex flex-col justify-between space-y-3">
                    {day.isRestDay ? (
                      <div className="py-3 flex flex-col items-center justify-center text-center text-muted-foreground my-auto">
                        <Coffee className="h-7 w-7 text-muted-foreground/60 mb-1.5" />
                        <span className="text-xs font-medium text-foreground/80">
                          {t.routine.restDay}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          {locale === 'tr' ? 'Toparlanma günü' : 'Recovery day'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {day.title && (
                          <p className="text-xs font-semibold text-foreground line-clamp-1">
                            {day.title}
                          </p>
                        )}

                        {day.muscleGroups && day.muscleGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {day.muscleGroups.map((group) => (
                              <span
                                key={group}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                              >
                                {getMuscleGroupLabel(group)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {locale === 'tr' ? 'Kas grubu seçilmedi' : 'No muscles selected'}
                          </p>
                        )}

                        {day.notes && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 italic bg-muted/30 p-1.5 rounded">
                            {day.notes}
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditor(day)}
                      className="w-full text-xs h-7 gap-1 mt-auto hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                    >
                      <Edit2 className="h-3 w-3" />
                      {t.routine.editDay}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Edit Dialog */}
      <Dialog open={!!editingDay} onOpenChange={(open) => !open && setEditingDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-primary" />
              {editingDay ? t.routine.daysLong[editingDay.dayOfWeek - 1] : ''} - {t.routine.editDay}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {locale === 'tr'
                ? 'Bu gün için antrenman veya dinlenme planınızı güncelleyin.'
                : 'Update your workout or rest plan for this day.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Rest Day Switch / Checkbox */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="is-rest-day" className="text-sm font-medium cursor-pointer">
                  {t.routine.isRest}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {locale === 'tr' ? 'Bugün spor salonuna gidilmeyecek' : 'No gym workout planned today'}
                </p>
              </div>
              <Checkbox
                id="is-rest-day"
                checked={editIsRest}
                onCheckedChange={(checked) => setEditIsRest(!!checked)}
              />
            </div>

            {!editIsRest && (
              <>
                {/* Workout Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="day-title" className="text-xs font-medium">
                    {t.routine.dayTitle}
                  </Label>
                  <Input
                    id="day-title"
                    placeholder={t.routine.dayTitlePlaceholder}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Muscle Groups Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {t.routine.selectMuscles}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {MUSCLE_GROUPS.map((group) => {
                      const selected = editMuscles.includes(group);
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => handleToggleMuscle(group)}
                          className={cn(
                            'text-xs py-2 px-2.5 rounded-lg border font-medium transition-all text-center flex items-center justify-center gap-1.5',
                            selected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'border-border bg-card hover:bg-accent hover:text-foreground text-muted-foreground'
                          )}
                        >
                          <span>{getMuscleGroupLabel(group)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="day-notes" className="text-xs font-medium">
                    {t.routine.dayNotes}
                  </Label>
                  <Textarea
                    id="day-notes"
                    placeholder={t.routine.dayNotesPlaceholder}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingDay(null)}
            >
              {locale === 'tr' ? 'Vazgeç' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={handleSaveDay}
              disabled={updateRoutine.isPending}
            >
              {updateRoutine.isPending ? t.routine.saving : t.routine.saveRoutine}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStatistics, useFriendActivity, useWorkouts, useProfile, useRoutine, useRecommendation } from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { type MuscleGroup } from '@/lib/validations';
import { getTodayString } from '@/lib/utils';
import { WorkoutDialog } from '@/components/workout-dialog';
import { MotivationalNudge } from '@/components/motivational-nudge';
import { SocialInteractions } from '@/components/social-interactions';
import { LeaderboardCard } from '@/components/leaderboard-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Dumbbell,
  ClipboardList,
  Coffee,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
} from 'lucide-react';

export default function DashboardPage() {
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [customDefaultMuscles, setCustomDefaultMuscles] = useState<MuscleGroup[]>([]);
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const { data: profile } = useProfile();
  const { data: recentWorkouts } = useWorkouts({ limit: 5 });
  const { data: friendActivity } = useFriendActivity();
  const { data: routineData, isLoading: routineLoading } = useRoutine();
  const { data: recommendation } = useRecommendation();
  const { t, formatRelativeDate, getMuscleGroupLabel, locale } = useLanguage();

  const weeklyGoal = profile?.weeklyGoal || 4;
  const weeklyProgress = stats ? Math.min((stats.activeDaysThisWeek / weeklyGoal) * 100, 100) : 0;
  const goalReached = stats ? stats.activeDaysThisWeek >= weeklyGoal : false;

  const todayStr = getTodayString();
  const isTodayLogged = recentWorkouts?.some((w) => w.date === todayStr);

  const currentDayOfWeek = (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  })();

  const todayRoutine = routineData?.routine?.find((r) => r.dayOfWeek === currentDayOfWeek);
  const hasRoutineConfigured = routineData?.routine && routineData.routine.length > 0;

  const handleStartTodayWorkout = () => {
    if (todayRoutine && !todayRoutine.isRestDay && todayRoutine.muscleGroups.length > 0) {
      setCustomDefaultMuscles(todayRoutine.muscleGroups as MuscleGroup[]);
    } else {
      setCustomDefaultMuscles([]);
    }
    setWorkoutDialogOpen(true);
  };

  const handleGenericAddWorkout = () => {
    setCustomDefaultMuscles([]);
    setWorkoutDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
          <p className="text-muted-foreground">
            {t.dashboard.welcome}, {profile?.username}
          </p>
        </div>
        <Button onClick={handleGenericAddWorkout} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">{t.dashboard.addWorkout}</span>
        </Button>
      </div>

      {/* Today's Routine Banner */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {t.routine.todayRoutine} ({t.routine.daysLong[currentDayOfWeek - 1]})
                  </span>
                  {isTodayLogged && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      {locale === 'tr' ? 'Tamamlandı' : 'Completed'}
                    </span>
                  )}
                </div>

                {todayRoutine?.isRestDay ? (
                  <div className="flex items-center gap-2 text-muted-foreground pt-0.5">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {t.routine.restDay}
                    </p>
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      — {t.routine.restDayDesc}
                    </span>
                  </div>
                ) : todayRoutine?.muscleGroups && todayRoutine.muscleGroups.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold text-foreground">
                      {todayRoutine.title || t.routine.workoutPlanned}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {todayRoutine.muscleGroups.map((group) => (
                        <span
                          key={group}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/15 text-primary border border-primary/25"
                        >
                          {getMuscleGroupLabel(group)}
                        </span>
                      ))}
                      {todayRoutine.notes && (
                        <span className="text-xs text-muted-foreground italic ml-1">
                          ({todayRoutine.notes})
                        </span>
                      )}
                    </div>
                  </div>
                ) : hasRoutineConfigured ? (
                  <p className="text-sm text-muted-foreground">
                    {locale === 'tr' ? 'Bugün için özel bir antrenman belirlenmemiş.' : 'No workout planned for today.'}
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {t.routine.noRoutineSet}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'tr'
                        ? 'Her gün ne yapacağınızı düşünmemek için haftalık programınızı tek tıkla kurun.'
                        : 'Set up your weekly routine to never wonder what to train each day.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {!hasRoutineConfigured ? (
                <Link href="/routine">
                  <Button size="sm" className="gap-1.5 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.routine.createRoutineBtn}
                  </Button>
                </Link>
              ) : isTodayLogged ? (
                <div className="flex items-center gap-2">
                  <Link href="/routine">
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      {locale === 'tr' ? 'Programı Gör' : 'View Routine'}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ) : !todayRoutine?.isRestDay && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleStartTodayWorkout}
                    size="sm"
                    className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm hover:brightness-105"
                  >
                    <Dumbbell className="h-3.5 w-3.5" />
                    {t.routine.logTodayBtn}
                  </Button>
                  <Link href="/routine">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                      {locale === 'tr' ? 'Düzenle' : 'Edit'}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Coach Recommendation Card */}
      {recommendation && !isTodayLogged && (
        <Card className="border-indigo-500/30 bg-gradient-to-br from-card via-card to-indigo-500/5 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Zap className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {t.recommendation.title}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {t.recommendation.badge}
                  </span>
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">
              {locale === 'tr' ? recommendation.reasonTr : recommendation.reasonEn}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {recommendation.isRest ? t.recommendation.restDayRecommended : t.recommendation.restedReady}:
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {locale === 'tr' ? recommendation.titleTr : recommendation.titleEn}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {recommendation.muscleGroups.map((group) => (
                    <span
                      key={group}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                    >
                      {getMuscleGroupLabel(group)}
                    </span>
                  ))}
                  {recommendation.detailedAnalysis.yesterdayMuscles.length > 0 && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                      {t.recommendation.yesterdayTrained}:{' '}
                      {recommendation.detailedAnalysis.yesterdayMuscles.map((m) => getMuscleGroupLabel(m)).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {!recommendation.isRest && (
                <Button
                  size="sm"
                  onClick={() => {
                    setCustomDefaultMuscles(recommendation.muscleGroups);
                    setWorkoutDialogOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs gap-1.5 shrink-0 shadow-sm"
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                  {t.recommendation.startRecommendedBtn}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational Nudge (Harekete Geçirici) */}
      <MotivationalNudge
        activeDaysThisWeek={stats?.activeDaysThisWeek || 0}
        weeklyGoal={weeklyGoal}
        currentStreak={stats?.currentStreak || 0}
      />

      {/* Weekly Goal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">{t.dashboard.weeklyGoal}</span>
            </div>
            <span className={`text-sm font-semibold ${goalReached ? 'text-primary' : 'text-muted-foreground'}`}>
              {stats?.activeDaysThisWeek || 0} / {weeklyGoal} {t.dashboard.goalSuffix}
              {goalReached && ' 🎉'}
            </span>
          </div>
          <Progress value={weeklyProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{t.dashboard.thisWeek}</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.workoutsThisWeek || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t.dashboard.workouts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{t.dashboard.thisMonth}</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.workoutsThisMonth || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t.dashboard.workouts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{t.dashboard.streak}</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.currentStreak || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t.dashboard.days}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Dumbbell className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{t.dashboard.total}</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.totalWorkouts || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t.dashboard.workouts}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.recentWorkouts}</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentWorkouts || recentWorkouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t.dashboard.noWorkouts}
              </p>
            ) : (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                        <Dumbbell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {workout.muscleGroups.map((mg) => getMuscleGroupLabel(mg as MuscleGroup)).join(' + ')}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <span>{formatRelativeDate(workout.date)}</span>
                          {workout.buddies && workout.buddies.length > 0 && (
                            <span className="inline-flex items-center gap-1 font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded text-[11px]">
                              <span>🤝</span>
                              <span>{workout.buddies.map((b) => b.username).join(', ')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <SocialInteractions
                      workoutId={workout.id}
                      initialFistBumpCount={workout.fistBumpCount || 0}
                      initialHasFistBumped={workout.hasFistBumped || false}
                      initialFistBumps={workout.fistBumps || []}
                      initialCommentCount={workout.commentCount || 0}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friend Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.friendActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            {!friendActivity || friendActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t.dashboard.noActivity}
              </p>
            ) : (
              <div className="space-y-3">
                {friendActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Link href={`/users/${activity.user.id}`}>
                        <Avatar className="h-9 w-9 shrink-0 mt-0.5 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer">
                          <AvatarFallback className="text-xs">
                            {activity.user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <Link
                            href={`/users/${activity.user.id}`}
                            className="font-semibold hover:text-primary transition-colors cursor-pointer"
                          >
                            {activity.user.username}
                          </Link>{' '}
                          {t.dashboard.completedWorkout}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <span>
                            {formatRelativeDate(activity.date)} •{' '}
                            {activity.muscleGroups
                              .map((mg) => getMuscleGroupLabel(mg as MuscleGroup))
                              .join(' + ')}
                          </span>
                          {activity.buddies && activity.buddies.length > 0 && (
                            <span className="inline-flex items-center gap-1 font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded text-[11px]">
                              <span>🤝</span>
                              <span>{activity.buddies.map((b) => b.username).join(', ')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <SocialInteractions
                      workoutId={activity.id}
                      initialFistBumpCount={activity.fistBumpCount || 0}
                      initialHasFistBumped={activity.hasFistBumped || false}
                      initialFistBumps={activity.fistBumps || []}
                      initialCommentCount={activity.commentCount || 0}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Card Preview */}
      <LeaderboardCard compact />

      <WorkoutDialog
        open={workoutDialogOpen}
        onOpenChange={setWorkoutDialogOpen}
        defaultMuscleGroups={customDefaultMuscles}
      />
    </div>
  );
}

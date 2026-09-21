'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStatistics, useFriendActivity, useWorkouts, useProfile } from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { type MuscleGroup } from '@/lib/validations';
import { WorkoutDialog } from '@/components/workout-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';

export default function DashboardPage() {
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const { data: profile } = useProfile();
  const { data: recentWorkouts } = useWorkouts({ limit: 3 });
  const { data: friendActivity } = useFriendActivity();
  const { t, formatRelativeDate, getMuscleGroupLabel } = useLanguage();

  const weeklyGoal = profile?.weeklyGoal || 4;
  const weeklyProgress = stats ? Math.min((stats.activeDaysThisWeek / weeklyGoal) * 100, 100) : 0;
  const goalReached = stats ? stats.activeDaysThisWeek >= weeklyGoal : false;

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
        <Button onClick={() => setWorkoutDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">{t.dashboard.addWorkout}</span>
        </Button>
      </div>

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
                  <div key={workout.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {workout.muscleGroups.map((mg) => getMuscleGroupLabel(mg as MuscleGroup)).join(' + ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(workout.date)}
                      </p>
                    </div>
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
                  <Link
                    key={activity.id}
                    href={`/users/${activity.user.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-accent/40 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {activity.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold hover:text-primary transition-colors">{activity.user.username}</span>{' '}
                        {t.dashboard.completedWorkout}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(activity.date)} •{' '}
                        {activity.muscleGroups.map((mg) => getMuscleGroupLabel(mg as MuscleGroup)).join(' + ')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WorkoutDialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen} />
    </div>
  );
}

'use client';

import { use } from 'react';
import Link from 'next/link';
import { useUserProfile, useSendFriendRequest, useUserRoutine } from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { type MuscleGroup } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  Flame,
  Trophy,
  TrendingUp,
  Target,
  UserCheck,
  UserPlus,
  Clock,
  Activity,
  ClipboardList,
  Coffee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(142, 71%, 45%)', // primary green
  'hsl(199, 89%, 48%)', // blue
  'hsl(43, 96%, 58%)',  // yellow
  'hsl(0, 84%, 60%)',   // red
  'hsl(262, 83%, 58%)', // purple
  'hsl(24, 95%, 53%)',  // orange
  'hsl(173, 80%, 40%)', // teal
  'hsl(330, 81%, 60%)', // pink
  'hsl(210, 40%, 60%)', // gray-blue
];

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useUserProfile(id);
  const { data: routineData } = useUserRoutine(id);
  const { t, locale, formatRelativeDate, getMuscleGroupLabel } = useLanguage();
  const sendRequest = useSendFriendRequest();

  const currentDayOfWeek = (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">{t.friends.loading}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/friends">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t.friendProfile.back}
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <h2 className="text-xl font-semibold">{t.friendProfile.notFound}</h2>
            <p className="text-sm text-muted-foreground">{t.friendProfile.userNotFoundDesc}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, isSelf, isFriend, friendshipStatus, statistics } = data;
  const weeklyGoal = user.weeklyGoal || 4;
  const weeklyProgress = Math.min((statistics.activeDaysThisWeek / weeklyGoal) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/friends">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t.friendProfile.back}
          </Button>
        </Link>
      </div>

      {/* User Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarFallback className="text-2xl font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{user.username}</h1>
                  {isFriend && !isSelf && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <UserCheck className="h-3 w-3" />
                      {t.friendProfile.friendBadge}
                    </span>
                  )}
                  {friendshipStatus === 'PENDING' && !isSelf && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Clock className="h-3 w-3" />
                      {t.friendProfile.pendingBadge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {t.profile.joined}{' '}
                    {new Date(user.createdAt).toLocaleDateString(
                      locale === 'tr' ? 'tr-TR' : 'en-US',
                      { month: 'long', year: 'numeric' }
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-4 w-4" />
                    {statistics.totalWorkouts} {t.dashboard.workouts}
                  </span>
                </div>
              </div>
            </div>

            {!isSelf && !isFriend && friendshipStatus === 'NONE' && (
              <Button
                onClick={() => sendRequest.mutate(user.username)}
                disabled={sendRequest.isPending}
                className="gap-2 shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                {t.friendProfile.addFriend}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goal Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">{t.dashboard.weeklyGoal}</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
              {statistics.activeDaysThisWeek} / {weeklyGoal} {t.dashboard.goalSuffix}
              {statistics.activeDaysThisWeek >= weeklyGoal && ' 🎉'}
            </span>
          </div>
          <Progress value={weeklyProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{t.statistics.thisWeek}</span>
            </div>
            <p className="text-2xl font-bold">{statistics.workoutsThisWeek}</p>
            <p className="text-xs text-muted-foreground">{t.dashboard.workouts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{t.statistics.thisMonth}</span>
            </div>
            <p className="text-2xl font-bold">{statistics.workoutsThisMonth}</p>
            <p className="text-xs text-muted-foreground">{t.dashboard.workouts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase">{t.statistics.currentStreak}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{statistics.currentStreak} {t.dashboard.days}</p>
            <p className="text-xs text-muted-foreground">{t.statistics.longestStreak}: {statistics.longestStreak} {t.dashboard.days}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{t.statistics.avgPerWeek}</span>
            </div>
            <p className="text-2xl font-bold">{statistics.avgPerWeek}</p>
            <p className="text-xs text-muted-foreground">{t.dashboard.workouts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Routine / Split */}
      {routineData?.routine && routineData.routine.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              {locale === 'tr' ? `${user.username} Haftalık Antrenman Programı` : `${user.username}'s Weekly Routine`}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === 'tr'
                ? 'Haftanın günlerine göre belirlenmiş antrenman ve dinlenme spliti'
                : 'Planned workout and rest split across the week'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((dayNum) => {
                const dayPlan = routineData.routine.find((r) => r.dayOfWeek === dayNum);
                const isToday = dayNum === currentDayOfWeek;
                const dayName = t.routine.daysLong[dayNum - 1];

                return (
                  <div
                    key={dayNum}
                    className={cn(
                      'p-2.5 rounded-lg border flex flex-col justify-between min-h-[110px] relative text-xs',
                      isToday
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border/70 bg-card/60'
                    )}
                  >
                    {isToday && (
                      <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                        {t.routine.today}
                      </span>
                    )}
                    <span className={cn('font-semibold text-xs mb-1.5', isToday ? 'text-primary' : 'text-foreground')}>
                      {dayName}
                    </span>

                    {dayPlan?.isRestDay ? (
                      <div className="my-auto text-center flex flex-col items-center py-2 text-muted-foreground">
                        <Coffee className="h-4 w-4 mb-1 text-muted-foreground/70" />
                        <span className="text-[11px] font-medium">{t.routine.restDay}</span>
                      </div>
                    ) : dayPlan && dayPlan.muscleGroups && dayPlan.muscleGroups.length > 0 ? (
                      <div className="space-y-1.5 my-auto">
                        {dayPlan.title && (
                          <p className="font-semibold text-foreground text-[11px] line-clamp-1">
                            {dayPlan.title}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {dayPlan.muscleGroups.map((mg) => (
                            <span
                              key={mg}
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {getMuscleGroupLabel(mg)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic my-auto">
                        {locale === 'tr' ? 'Boş' : 'Empty'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* What did they train? (Muscle Group Distribution) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            {t.friendProfile.whatWorkedOut}
          </CardTitle>
          <CardDescription>
            {user.username} adlı kullanıcının en çok ağırlık verdiği kas grupları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statistics.muscleGroupDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t.friendProfile.noMuscleData}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics.muscleGroupDistribution.map((mg) => ({
                        name: getMuscleGroupLabel(mg.muscleGroup as MuscleGroup),
                        value: mg.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statistics.muscleGroupDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5">
                {statistics.muscleGroupDistribution.map((mg, i) => (
                  <div key={mg.muscleGroup} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="font-medium">
                          {getMuscleGroupLabel(mg.muscleGroup as MuscleGroup)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">({mg.count} {t.dashboard.workouts})</span>
                        <span className="font-bold text-sm">{mg.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={mg.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      {statistics.heatmapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.statistics.activityHeatmapTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-grid grid-flow-col auto-cols-[14px] gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 14px)' }}>
                {statistics.heatmapData.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'rounded-sm transition-colors',
                          day.count === 0 && 'bg-muted',
                          day.count === 1 && 'bg-primary/30',
                          day.count === 2 && 'bg-primary/60',
                          day.count >= 3 && 'bg-primary'
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatRelativeDate(day.date)}: {day.count} {t.statistics.workoutsCount}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>{t.statistics.less}</span>
                <div className="h-3 w-3 rounded-sm bg-muted" />
                <div className="h-3 w-3 rounded-sm bg-primary/30" />
                <div className="h-3 w-3 rounded-sm bg-primary/60" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
                <span>{t.statistics.more}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workout History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t.friendProfile.workoutHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statistics.recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t.friendProfile.noWorkoutsRecorded}
            </p>
          ) : (
            <div className="space-y-3">
              {statistics.recentWorkouts.map((w) => (
                <div key={w.id} className="flex items-start gap-3 p-3.5 rounded-lg bg-muted/50 border border-border/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {w.muscleGroups
                          .map((mg) => getMuscleGroupLabel(mg as MuscleGroup))
                          .join(' + ')}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeDate(w.date)}
                      </span>
                    </div>
                    {w.buddies && w.buddies.length > 0 && (
                      <p className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
                        <span>🤝</span>
                        <span>{w.buddies.map((b) => b.username).join(', ')} {locale === 'tr' ? 'ile birlikte' : 'with'}</span>
                      </p>
                    )}
                    {w.note && (
                      <p className="text-xs text-muted-foreground mt-1 bg-background/50 rounded p-2 border border-border/20">
                        💬 {w.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

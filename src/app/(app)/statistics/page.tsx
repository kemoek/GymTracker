'use client';

import { useStatistics } from '@/lib/hooks';
import { type MuscleGroup } from '@/lib/validations';
import { useLanguage } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Flame,
  Trophy,
  TrendingUp,
  Calendar,
  Dumbbell,
  Activity,
} from 'lucide-react';
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

export default function StatisticsPage() {
  const { data: stats, isLoading } = useStatistics();
  const { t, formatRelativeDate, getMuscleGroupLabel } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t.statistics.loading}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t.statistics.noStats}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.statistics.title}</h1>

      {/* General Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Dumbbell} label={t.statistics.totalWorkouts} value={stats.totalWorkouts} />
        <StatCard icon={Calendar} label={t.statistics.thisWeek} value={stats.workoutsThisWeek} />
        <StatCard icon={TrendingUp} label={t.statistics.thisMonth} value={stats.workoutsThisMonth} />
        <StatCard icon={Activity} label={t.statistics.avgPerWeek} value={stats.avgPerWeek} />
        <StatCard icon={Flame} label={t.statistics.currentStreak} value={`${stats.currentStreak} ${t.dashboard.days}`} highlight />
        <StatCard icon={Trophy} label={t.statistics.longestStreak} value={`${stats.longestStreak} ${t.dashboard.days}`} />
        <StatCard icon={Calendar} label={t.statistics.last7Days} value={stats.workoutsLast7Days} />
        <StatCard icon={Calendar} label={t.statistics.last30Days} value={stats.workoutsLast30Days} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.statistics.weeklyChartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.statistics.monthlyChartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Bar dataKey="count" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Muscle Group Distribution */}
      {stats.muscleGroupDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.statistics.muscleDistributionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.muscleGroupDistribution.map((mg) => ({
                        name: getMuscleGroupLabel(mg.muscleGroup as MuscleGroup),
                        value: mg.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.muscleGroupDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {stats.muscleGroupDistribution.map((mg, i) => (
                  <div key={mg.muscleGroup} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-sm flex-1">
                      {getMuscleGroupLabel(mg.muscleGroup as MuscleGroup)}
                    </span>
                    <span className="text-sm font-medium">{mg.percentage}%</span>
                    <span className="text-xs text-muted-foreground">({mg.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap */}
      {stats.heatmapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.statistics.activityHeatmapTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-grid grid-flow-col auto-cols-[14px] gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 14px)' }}>
                {stats.heatmapData.map((day) => (
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
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Icon className={cn('h-4 w-4', highlight && 'text-primary')} />
          <span className="text-xs font-medium uppercase">{label}</span>
        </div>
        <p className={cn('text-2xl font-bold', highlight && 'text-primary')}>{value}</p>
      </CardContent>
    </Card>
  );
}

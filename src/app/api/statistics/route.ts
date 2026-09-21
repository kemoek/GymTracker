import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { getDateString, getWeekStart, getWeekEnd } from '@/lib/utils';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const now = new Date();
  const today = getDateString(now);
  const weekStart = getDateString(getWeekStart(now));
  const weekEnd = getDateString(getWeekEnd(now));
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

  // Last 7 and 30 days
  const last7 = getDateString(new Date(Date.now() - 7 * 86400000));
  const last30 = getDateString(new Date(Date.now() - 30 * 86400000));

  // All workouts for the user
  const allWorkouts = await prisma.workout.findMany({
    where: { userId: authResult.userId },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  const totalWorkouts = allWorkouts.length;

  // Get distinct active dates
  const allDates = [...new Set(allWorkouts.map((w) => w.date))].sort().reverse();

  const workoutsThisWeek = allWorkouts.filter(
    (w) => w.date >= weekStart && w.date <= weekEnd
  ).length;

  const workoutsThisMonth = allWorkouts.filter(
    (w) => w.date >= monthStart && w.date <= monthEnd
  ).length;

  const workoutsLast7Days = allWorkouts.filter(
    (w) => w.date >= last7 && w.date <= today
  ).length;

  const workoutsLast30Days = allWorkouts.filter(
    (w) => w.date >= last30 && w.date <= today
  ).length;

  // Active days this week (distinct dates)
  const activeDaysThisWeek = new Set(
    allWorkouts
      .filter((w) => w.date >= weekStart && w.date <= weekEnd)
      .map((w) => w.date)
  ).size;

  // Calculate streaks using distinct dates
  const { currentStreak, longestStreak } = calculateStreaks(allDates, today);

  // Average workouts per week (based on first workout date)
  let avgPerWeek = 0;
  if (allDates.length > 0) {
    const firstDate = new Date(allDates[allDates.length - 1]);
    const daysSinceFirst = Math.max(1, Math.floor((now.getTime() - firstDate.getTime()) / 86400000));
    const weeksSinceFirst = Math.max(1, daysSinceFirst / 7);
    avgPerWeek = Math.round((totalWorkouts / weeksSinceFirst) * 10) / 10;
  }

  // Muscle group distribution
  const muscleGroupCounts = await prisma.workoutMuscleGroup.groupBy({
    by: ['muscleGroup'],
    where: {
      workout: { userId: authResult.userId },
    },
    _count: true,
  });

  const totalMuscleGroups = muscleGroupCounts.reduce((sum, mg) => sum + mg._count, 0);
  const muscleGroupDistribution = muscleGroupCounts
    .map((mg) => ({
      muscleGroup: mg.muscleGroup,
      count: mg._count,
      percentage: totalMuscleGroups > 0
        ? Math.round((mg._count / totalMuscleGroups) * 100)
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Weekly workout counts (last 12 weeks)
  const weeklyData = getWeeklyData(allWorkouts, 12);

  // Monthly workout counts (last 6 months)
  const monthlyData = getMonthlyData(allWorkouts, 6);

  // Heatmap data (last 365 days)
  const heatmapData = getHeatmapData(allWorkouts, today);

  return NextResponse.json({
    totalWorkouts,
    workoutsThisWeek,
    workoutsThisMonth,
    workoutsLast7Days,
    workoutsLast30Days,
    activeDaysThisWeek,
    currentStreak,
    longestStreak,
    avgPerWeek,
    muscleGroupDistribution,
    weeklyData,
    monthlyData,
    heatmapData,
  });
}

function calculateStreaks(
  sortedDatesDesc: string[],
  today: string
): { currentStreak: number; longestStreak: number } {
  if (sortedDatesDesc.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort ascending for streak calculation
  const dates = [...sortedDatesDesc].sort();

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      currentRun++;
    } else if (diffDays > 1) {
      currentRun = 1;
    }
    // diffDays === 0 means same date, skip
    longestStreak = Math.max(longestStreak, currentRun);
  }

  // Current streak: count consecutive days ending today or yesterday
  const lastDate = dates[dates.length - 1];
  const lastDateObj = new Date(lastDate);
  const todayObj = new Date(today);
  const daysSinceLast = Math.round(
    (todayObj.getTime() - lastDateObj.getTime()) / 86400000
  );

  if (daysSinceLast > 1) {
    return { currentStreak: 0, longestStreak };
  }

  let currentStreak = 1;
  for (let i = dates.length - 2; i >= 0; i--) {
    const curr = new Date(dates[i + 1]);
    const prev = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      currentStreak++;
    } else if (diffDays > 1) {
      break;
    }
    // diffDays === 0: same date, continue
  }

  return { currentStreak, longestStreak };
}

function getWeeklyData(
  workouts: { date: string }[],
  weeks: number
): { week: string; count: number }[] {
  const result: { week: string; count: number }[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - i * 7);
    const start = getWeekStart(weekDate);
    const end = getWeekEnd(weekDate);
    const startStr = getDateString(start);
    const endStr = getDateString(end);

    const count = workouts.filter(
      (w) => w.date >= startStr && w.date <= endStr
    ).length;

    const label = `${start.getDate()}/${start.getMonth() + 1}`;
    result.push({ week: label, count });
  }

  return result;
}

function getMonthlyData(
  workouts: { date: string }[],
  months: number
): { month: string; count: number }[] {
  const result: { month: string; count: number }[] = [];
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const count = workouts.filter((w) => w.date.startsWith(yearMonth)).length;
    result.push({ month: monthNames[d.getMonth()], count });
  }

  return result;
}

function getHeatmapData(
  workouts: { date: string }[],
  today: string
): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  const todayDate = new Date(today);

  // Count workouts per date
  const countMap = new Map<string, number>();
  for (const w of workouts) {
    countMap.set(w.date, (countMap.get(w.date) || 0) + 1);
  }

  // Generate last 365 days
  for (let i = 364; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = getDateString(d);
    result.push({
      date: dateStr,
      count: countMap.get(dateStr) || 0,
    });
  }

  return result;
}

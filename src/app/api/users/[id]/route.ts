import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { getDateString, getWeekStart, getWeekEnd } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;
  const currentUserId = authResult.userId;

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      weeklyGoal: true,
      createdAt: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isSelf = currentUserId === targetUser.id;

  // Check friendship status if not self
  let friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED' = 'NONE';
  let isFriend = isSelf;

  if (!isSelf) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: currentUserId },
        ],
      },
    });

    if (friendship) {
      friendshipStatus = friendship.status as 'PENDING' | 'ACCEPTED';
      isFriend = friendship.status === 'ACCEPTED';
    }
  }

  const now = new Date();
  const today = getDateString(now);
  const weekStart = getDateString(getWeekStart(now));
  const weekEnd = getDateString(getWeekEnd(now));
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

  // Fetch workouts and statistics
  const allWorkouts = await prisma.workout.findMany({
    where: { userId: targetUser.id },
    select: {
      id: true,
      date: true,
      note: true,
      muscleGroups: {
        select: { muscleGroup: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  const totalWorkouts = allWorkouts.length;
  const allDates = [...new Set(allWorkouts.map((w) => w.date))].sort().reverse();

  const workoutsThisWeek = allWorkouts.filter(
    (w) => w.date >= weekStart && w.date <= weekEnd
  ).length;

  const workoutsThisMonth = allWorkouts.filter(
    (w) => w.date >= monthStart && w.date <= monthEnd
  ).length;

  const activeDaysThisWeek = new Set(
    allWorkouts
      .filter((w) => w.date >= weekStart && w.date <= weekEnd)
      .map((w) => w.date)
  ).size;

  // Streak calculations
  const { currentStreak, longestStreak } = calculateStreaks(allDates, today);

  // Weekly average
  let avgPerWeek = 0;
  if (allDates.length > 0) {
    const firstDate = new Date(allDates[allDates.length - 1]);
    const daysSinceFirst = Math.max(1, Math.floor((now.getTime() - firstDate.getTime()) / 86400000));
    const weeksSinceFirst = Math.max(1, daysSinceFirst / 7);
    avgPerWeek = Math.round((totalWorkouts / weeksSinceFirst) * 10) / 10;
  }

  // Muscle group counts
  const muscleGroupCounts = await prisma.workoutMuscleGroup.groupBy({
    by: ['muscleGroup'],
    where: {
      workout: { userId: targetUser.id },
    },
    _count: true,
  });

  const totalMuscleGroups = muscleGroupCounts.reduce((sum, mg) => sum + mg._count, 0);
  const muscleGroupDistribution = muscleGroupCounts
    .map((mg) => ({
      muscleGroup: mg.muscleGroup,
      count: mg._count,
      percentage: totalMuscleGroups > 0 ? Math.round((mg._count / totalMuscleGroups) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Heatmap data (last 365 days)
  const heatmapMap = new Map<string, number>();
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    heatmapMap.set(getDateString(d), 0);
  }

  allWorkouts.forEach((w) => {
    if (heatmapMap.has(w.date)) {
      heatmapMap.set(w.date, (heatmapMap.get(w.date) || 0) + 1);
    }
  });

  const heatmapData = Array.from(heatmapMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Recent 10 workouts
  const recentWorkouts = allWorkouts.slice(0, 10).map((w) => ({
    id: w.id,
    date: w.date,
    note: w.note,
    muscleGroups: w.muscleGroups.map((mg) => mg.muscleGroup),
  }));

  return NextResponse.json({
    user: targetUser,
    isSelf,
    isFriend,
    friendshipStatus,
    statistics: {
      totalWorkouts,
      workoutsThisWeek,
      workoutsThisMonth,
      activeDaysThisWeek,
      currentStreak,
      longestStreak,
      avgPerWeek,
      muscleGroupDistribution,
      heatmapData,
      recentWorkouts,
    },
  });
}

function calculateStreaks(
  sortedDatesDesc: string[],
  today: string
): { currentStreak: number; longestStreak: number } {
  if (sortedDatesDesc.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

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
    longestStreak = Math.max(longestStreak, currentRun);
  }

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
  }

  return { currentStreak, longestStreak };
}

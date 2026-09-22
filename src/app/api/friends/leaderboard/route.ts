import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { getDateString, getWeekStart, getWeekEnd, getTodayString } from '@/lib/utils';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const currentUserId = authResult.userId;

  // 1. Get current user's accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: currentUserId },
        { addresseeId: currentUserId },
      ],
    },
  });

  const friendIds = friendships.map((f) =>
    f.requesterId === currentUserId ? f.addresseeId : f.requesterId
  );

  // Pool consists of current user + all their accepted friends
  const userIds = Array.from(new Set([currentUserId, ...friendIds]));

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      weeklyGoal: true,
      workouts: {
        select: {
          id: true,
          date: true,
        },
      },
    },
  });

  const now = new Date();
  const today = getTodayString();
  const weekStart = getDateString(getWeekStart(now));
  const weekEnd = getDateString(getWeekEnd(now));

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const monthEnd = `${year}-${month}-31`;

  const userStats = users.map((u) => {
    const workoutsThisWeek = u.workouts.filter(
      (w) => w.date >= weekStart && w.date <= weekEnd
    ).length;

    const workoutsThisMonth = u.workouts.filter(
      (w) => w.date >= monthStart && w.date <= monthEnd
    ).length;

    const allDates = [...new Set(u.workouts.map((w) => w.date))].sort();

    // Streak calculation
    let currentStreak = 0;
    if (allDates.length > 0) {
      const lastDate = allDates[allDates.length - 1];
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);
      const daysSinceLast = Math.round(
        (todayObj.getTime() - lastDateObj.getTime()) / 86400000
      );

      if (daysSinceLast <= 1) {
        currentStreak = 1;
        for (let i = allDates.length - 2; i >= 0; i--) {
          const curr = new Date(allDates[i + 1]);
          const prev = new Date(allDates[i]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
          if (diffDays === 1) {
            currentStreak++;
          } else if (diffDays > 1) {
            break;
          }
        }
      }
    }

    return {
      user: {
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
      },
      weeklyGoal: u.weeklyGoal,
      isSelf: u.id === currentUserId,
      workoutsThisWeek,
      workoutsThisMonth,
      currentStreak,
      totalWorkouts: u.workouts.length,
    };
  });

  // Sort by weekly workouts desc, then streak desc, then username asc
  const weeklyRanking = [...userStats]
    .sort((a, b) => {
      if (b.workoutsThisWeek !== a.workoutsThisWeek) {
        return b.workoutsThisWeek - a.workoutsThisWeek;
      }
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      return a.user.username.localeCompare(b.user.username);
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Sort by monthly workouts desc
  const monthlyRanking = [...userStats]
    .sort((a, b) => {
      if (b.workoutsThisMonth !== a.workoutsThisMonth) {
        return b.workoutsThisMonth - a.workoutsThisMonth;
      }
      return a.user.username.localeCompare(b.user.username);
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Sort by streak desc
  const streakRanking = [...userStats]
    .sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      return a.user.username.localeCompare(b.user.username);
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return NextResponse.json({
    weeklyRanking,
    monthlyRanking,
    streakRanking,
  });
}

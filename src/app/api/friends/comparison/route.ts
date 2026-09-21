import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { getDateString, getWeekStart, getWeekEnd } from '@/lib/utils';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  // Get accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: authResult.userId },
        { addresseeId: authResult.userId },
      ],
    },
  });

  const friendIds = friendships.map((f) =>
    f.requesterId === authResult.userId ? f.addresseeId : f.requesterId
  );

  const allUserIds = [authResult.userId, ...friendIds];

  const now = new Date();
  const weekStart = getDateString(getWeekStart(now));
  const weekEnd = getDateString(getWeekEnd(now));
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, username: true, avatarUrl: true },
  });

  const comparison = await Promise.all(
    users.map(async (user) => {
      const weeklyCount = await prisma.workout.count({
        where: {
          userId: user.id,
          date: { gte: weekStart, lte: weekEnd },
        },
      });

      const monthlyCount = await prisma.workout.count({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
      });

      return {
        user,
        weeklyCount,
        monthlyCount,
      };
    })
  );

  // Sort by weekly count descending
  comparison.sort((a, b) => b.weeklyCount - a.weeklyCount);

  return NextResponse.json(comparison);
}

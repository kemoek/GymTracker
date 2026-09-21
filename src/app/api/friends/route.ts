import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { getDateString, getWeekStart, getWeekEnd } from '@/lib/utils';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: authResult.userId },
        { addresseeId: authResult.userId },
      ],
    },
    include: {
      requester: {
        select: { id: true, username: true, avatarUrl: true },
      },
      addressee: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  const now = new Date();
  const weekStart = getDateString(getWeekStart(now));
  const weekEnd = getDateString(getWeekEnd(now));

  const friends = await Promise.all(
    friendships.map(async (f) => {
      const friend =
        f.requesterId === authResult.userId ? f.addressee : f.requester;

      const workoutsThisWeek = await prisma.workout.count({
        where: {
          userId: friend.id,
          date: { gte: weekStart, lte: weekEnd },
        },
      });

      const lastWorkout = await prisma.workout.findFirst({
        where: { userId: friend.id },
        orderBy: { date: 'desc' },
        include: {
          muscleGroups: { select: { muscleGroup: true } },
        },
      });

      return {
        friendshipId: f.id,
        user: friend,
        workoutsThisWeek,
        lastWorkout: lastWorkout
          ? {
              date: lastWorkout.date,
              muscleGroups: lastWorkout.muscleGroups.map(
                (mg) => mg.muscleGroup
              ),
            }
          : null,
      };
    })
  );

  return NextResponse.json(friends);
}

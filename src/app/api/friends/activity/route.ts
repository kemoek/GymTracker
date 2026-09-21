import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

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

  if (friendIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get recent workouts from friends
  const recentWorkouts = await prisma.workout.findMany({
    where: {
      userId: { in: friendIds },
    },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
      muscleGroups: { select: { muscleGroup: true } },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });

  const result = recentWorkouts.map((w) => ({
    id: w.id,
    user: w.user,
    date: w.date,
    muscleGroups: w.muscleGroups.map((mg) => mg.muscleGroup),
  }));

  return NextResponse.json(result);
}

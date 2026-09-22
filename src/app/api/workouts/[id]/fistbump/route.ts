import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id: workoutId } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
  });

  if (!workout) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  // Check if current user already fist bumped
  const existing = await prisma.workoutFistBump.findUnique({
    where: {
      workoutId_userId: {
        workoutId,
        userId: authResult.userId,
      },
    },
  });

  if (existing) {
    // Remove fist bump
    await prisma.workoutFistBump.delete({
      where: { id: existing.id },
    });
  } else {
    // Add fist bump
    await prisma.workoutFistBump.create({
      data: {
        workoutId,
        userId: authResult.userId,
      },
    });
  }

  // Fetch updated list of fist bumps
  const fistBumps = await prisma.workoutFistBump.findMany({
    where: { workoutId },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  return NextResponse.json({
    hasFistBumped: !existing,
    count: fistBumps.length,
    users: fistBumps.map((fb) => fb.user),
  });
}

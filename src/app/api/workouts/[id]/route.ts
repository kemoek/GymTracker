import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { workoutSchema } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      muscleGroups: { select: { muscleGroup: true } },
      buddies: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!workout) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  if (workout.userId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    ...workout,
    muscleGroups: workout.muscleGroups.map((mg) => mg.muscleGroup),
    buddies: workout.buddies.map((b) => b.user),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const existing = await prisma.workout.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  if (existing.userId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = workoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { date, muscleGroups, note, buddyUserIds } = parsed.data;

    // Delete old muscle groups and buddies
    await prisma.workoutMuscleGroup.deleteMany({ where: { workoutId: id } });
    await prisma.workoutBuddy.deleteMany({ where: { workoutId: id } });

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        date,
        note: note || null,
        muscleGroups: {
          create: muscleGroups.map((mg) => ({ muscleGroup: mg })),
        },
        ...(buddyUserIds && buddyUserIds.length > 0 && {
          buddies: {
            create: buddyUserIds.map((buddyId) => ({ userId: buddyId })),
          },
        }),
      },
      include: {
        muscleGroups: { select: { muscleGroup: true } },
        buddies: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ...workout,
      muscleGroups: workout.muscleGroups.map((mg) => mg.muscleGroup),
      buddies: workout.buddies.map((b) => b.user),
    });
  } catch (error) {
    console.error('Workout update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const existing = await prisma.workout.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  if (existing.userId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.workout.delete({ where: { id } });

  return NextResponse.json({ message: 'Workout deleted' });
}

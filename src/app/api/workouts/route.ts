import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { workoutSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month'); // YYYY-MM
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to'); // YYYY-MM-DD
  const limit = searchParams.get('limit');

  const where: Record<string, unknown> = { userId: authResult.userId };

  if (month) {
    where.date = {
      gte: `${month}-01`,
      lte: `${month}-31`,
    };
  } else if (from || to) {
    where.date = {
      ...(from && { gte: from }),
      ...(to && { lte: to }),
    };
  }

  const workouts = await prisma.workout.findMany({
    where,
    include: {
      muscleGroups: { select: { muscleGroup: true } },
    },
    orderBy: { date: 'desc' },
    ...(limit && { take: parseInt(limit) }),
  });

  const result = workouts.map((w) => ({
    ...w,
    muscleGroups: w.muscleGroups.map((mg) => mg.muscleGroup),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = workoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { date, muscleGroups, note } = parsed.data;

    const workout = await prisma.workout.create({
      data: {
        userId: authResult.userId,
        date,
        note: note || null,
        muscleGroups: {
          create: muscleGroups.map((mg) => ({ muscleGroup: mg })),
        },
      },
      include: {
        muscleGroups: { select: { muscleGroup: true } },
      },
    });

    return NextResponse.json(
      {
        ...workout,
        muscleGroups: workout.muscleGroups.map((mg) => mg.muscleGroup),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Workout creation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { getWorkoutRecommendation } from '@/lib/recommendation';
import { getTodayString } from '@/lib/utils';

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || getTodayString();

  // Fetch past workouts (last 30 days is plenty for 7-day analysis)
  const workouts = await prisma.workout.findMany({
    where: { userId: authResult.userId },
    include: { muscleGroups: true },
    orderBy: { date: 'desc' },
    take: 30,
  });

  const formattedWorkouts = workouts.map((w) => ({
    date: w.date,
    muscleGroups: w.muscleGroups.map((mg) => mg.muscleGroup),
  }));

  const recommendation = getWorkoutRecommendation(formattedWorkouts, targetDate);

  return NextResponse.json(recommendation);
}

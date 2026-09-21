import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const routineDays = await prisma.routineDay.findMany({
    where: { userId: id },
    orderBy: { dayOfWeek: 'asc' },
  });

  const daysMap = new Map(routineDays.map((d) => [d.dayOfWeek, d]));
  const fullRoutine = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
    const existing = daysMap.get(dayOfWeek);
    return {
      dayOfWeek,
      isRestDay: existing?.isRestDay ?? (dayOfWeek === 4 || dayOfWeek === 7),
      title: existing?.title ?? (existing?.isRestDay ? 'Dinlenme' : null),
      muscleGroups: existing?.muscleGroups ? existing.muscleGroups.split(',').filter(Boolean) : [],
      notes: existing?.notes ?? '',
    };
  });

  return NextResponse.json({ routine: fullRoutine });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';
import { MUSCLE_GROUPS } from '@/lib/validations';

const daySchema = z.object({
  dayOfWeek: z.number().min(1).max(7),
  isRestDay: z.boolean(),
  title: z.string().max(50).nullable().optional(),
  muscleGroups: z.array(z.enum(MUSCLE_GROUPS)),
  notes: z.string().max(200).nullable().optional(),
});

const routineSchema = z.object({
  days: z.array(daySchema).length(7),
});

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const routineDays = await prisma.routineDay.findMany({
    where: { userId: authResult.userId },
    orderBy: { dayOfWeek: 'asc' },
  });

  // Map into 1..7 array
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

export async function PUT(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = routineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid routine data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { days } = parsed.data;

    // Save in transaction
    await prisma.$transaction(
      days.map((day) =>
        prisma.routineDay.upsert({
          where: {
            userId_dayOfWeek: {
              userId: authResult.userId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            isRestDay: day.isRestDay,
            title: day.title || null,
            muscleGroups: day.isRestDay ? '' : day.muscleGroups.join(','),
            notes: day.notes || null,
          },
          create: {
            userId: authResult.userId,
            dayOfWeek: day.dayOfWeek,
            isRestDay: day.isRestDay,
            title: day.title || null,
            muscleGroups: day.isRestDay ? '' : day.muscleGroups.join(','),
            notes: day.notes || null,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Routine update error:', error);
    return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 });
  }
}

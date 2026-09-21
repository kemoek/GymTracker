import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const presetSchema = z.object({
  preset: z.enum(['ppl', 'upper_lower', 'bro_split', 'full_body']),
});

const PRESETS = {
  ppl: [
    { dayOfWeek: 1, isRestDay: false, title: 'Push (İtiş)', muscleGroups: 'CHEST,SHOULDERS,TRICEPS' },
    { dayOfWeek: 2, isRestDay: false, title: 'Pull (Çekiş)', muscleGroups: 'BACK,BICEPS' },
    { dayOfWeek: 3, isRestDay: false, title: 'Legs (Bacak & Core)', muscleGroups: 'LEGS,ABS' },
    { dayOfWeek: 4, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
    { dayOfWeek: 5, isRestDay: false, title: 'Push (İtiş)', muscleGroups: 'CHEST,SHOULDERS,TRICEPS' },
    { dayOfWeek: 6, isRestDay: false, title: 'Pull (Çekiş)', muscleGroups: 'BACK,BICEPS' },
    { dayOfWeek: 7, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
  ],
  upper_lower: [
    { dayOfWeek: 1, isRestDay: false, title: 'Üst Vücut (Upper)', muscleGroups: 'CHEST,BACK,SHOULDERS,BICEPS,TRICEPS' },
    { dayOfWeek: 2, isRestDay: false, title: 'Alt Vücut (Lower)', muscleGroups: 'LEGS,ABS' },
    { dayOfWeek: 3, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
    { dayOfWeek: 4, isRestDay: false, title: 'Üst Vücut (Upper)', muscleGroups: 'CHEST,BACK,SHOULDERS,BICEPS,TRICEPS' },
    { dayOfWeek: 5, isRestDay: false, title: 'Alt Vücut (Lower)', muscleGroups: 'LEGS,ABS' },
    { dayOfWeek: 6, isRestDay: false, title: 'Kardiyo & Core', muscleGroups: 'CARDIO,ABS' },
    { dayOfWeek: 7, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
  ],
  bro_split: [
    { dayOfWeek: 1, isRestDay: false, title: 'Göğüs Günü', muscleGroups: 'CHEST,ABS' },
    { dayOfWeek: 2, isRestDay: false, title: 'Sırt Günü', muscleGroups: 'BACK' },
    { dayOfWeek: 3, isRestDay: false, title: 'Omuz Günü', muscleGroups: 'SHOULDERS,ABS' },
    { dayOfWeek: 4, isRestDay: false, title: 'Bacak Günü', muscleGroups: 'LEGS' },
    { dayOfWeek: 5, isRestDay: false, title: 'Kol Günü (Biceps & Triceps)', muscleGroups: 'BICEPS,TRICEPS' },
    { dayOfWeek: 6, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
    { dayOfWeek: 7, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
  ],
  full_body: [
    { dayOfWeek: 1, isRestDay: false, title: 'Tüm Vücut A', muscleGroups: 'CHEST,BACK,LEGS' },
    { dayOfWeek: 2, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
    { dayOfWeek: 3, isRestDay: false, title: 'Tüm Vücut B', muscleGroups: 'SHOULDERS,BICEPS,TRICEPS,ABS' },
    { dayOfWeek: 4, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
    { dayOfWeek: 5, isRestDay: false, title: 'Tüm Vücut C', muscleGroups: 'CHEST,BACK,LEGS,CARDIO' },
    { dayOfWeek: 6, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
    { dayOfWeek: 7, isRestDay: true, title: 'Dinlenme', muscleGroups: '' },
  ],
};

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = presetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid preset name' }, { status: 400 });
    }

    const template = PRESETS[parsed.data.preset];

    await prisma.$transaction(
      template.map((day) =>
        prisma.routineDay.upsert({
          where: {
            userId_dayOfWeek: {
              userId: authResult.userId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            isRestDay: day.isRestDay,
            title: day.title,
            muscleGroups: day.muscleGroups,
            notes: null,
          },
          create: {
            userId: authResult.userId,
            dayOfWeek: day.dayOfWeek,
            isRestDay: day.isRestDay,
            title: day.title,
            muscleGroups: day.muscleGroups,
            notes: null,
          },
        })
      )
    );

    return NextResponse.json({ success: true, preset: parsed.data.preset });
  } catch (error) {
    console.error('Preset apply error:', error);
    return NextResponse.json({ error: 'Failed to apply preset' }, { status: 500 });
  }
}

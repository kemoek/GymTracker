import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { weeklyGoalSchema } from '@/lib/validations';

export async function PUT(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = weeklyGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: authResult.userId },
      data: { weeklyGoal: parsed.data.weeklyGoal },
      select: { weeklyGoal: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Goal update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

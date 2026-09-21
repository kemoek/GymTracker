import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { updateProfileSchema } from '@/lib/validations';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      weeklyGoal: true,
      createdAt: true,
      _count: { select: { workouts: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    workoutCount: user._count.workouts,
    _count: undefined,
  });
}

export async function PUT(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, avatarUrl } = parsed.data;

    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, id: { not: authResult.userId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'This username is already taken' },
          { status: 409 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: authResult.userId },
      data: {
        ...(username && { username }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        weeklyGoal: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

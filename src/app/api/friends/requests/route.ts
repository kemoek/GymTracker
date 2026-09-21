import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const friendRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const requests = await prisma.friendship.findMany({
    where: {
      addresseeId: authResult.userId,
      status: 'PENDING',
    },
    include: {
      requester: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = friendRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.id === authResult.userId) {
      return NextResponse.json(
        { error: 'You cannot send a friend request to yourself' },
        { status: 400 }
      );
    }

    // Check for existing friendship in both directions
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: authResult.userId, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: authResult.userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json(
          { error: 'You are already friends' },
          { status: 409 }
        );
      }
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          { error: 'A friend request already exists' },
          { status: 409 }
        );
      }
      // If rejected, allow re-sending by updating
      const updated = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId: authResult.userId,
          addresseeId: targetUser.id,
          status: 'PENDING',
        },
      });
      return NextResponse.json(updated, { status: 201 });
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: authResult.userId,
        addresseeId: targetUser.id,
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error('Friend request error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const friendship = await prisma.friendship.findUnique({
    where: { id },
  });

  if (!friendship) {
    return NextResponse.json(
      { error: 'Friendship not found' },
      { status: 404 }
    );
  }

  if (
    friendship.requesterId !== authResult.userId &&
    friendship.addresseeId !== authResult.userId
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.friendship.delete({ where: { id } });

  return NextResponse.json({ message: 'Friend removed' });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function POST(
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
      { error: 'Friend request not found' },
      { status: 404 }
    );
  }

  if (friendship.addresseeId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (friendship.status !== 'PENDING') {
    return NextResponse.json(
      { error: 'This request has already been processed' },
      { status: 400 }
    );
  }

  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: 'ACCEPTED' },
  });

  return NextResponse.json(updated);
}

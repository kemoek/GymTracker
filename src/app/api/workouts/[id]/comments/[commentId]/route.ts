import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id: workoutId, commentId } = await params;

  const comment = await prisma.workoutComment.findUnique({
    where: { id: commentId },
    include: { workout: true },
  });

  if (!comment || comment.workoutId !== workoutId) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Only author or workout owner can delete
  if (comment.userId !== authResult.userId && comment.workout.userId !== authResult.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.workoutComment.delete({
    where: { id: commentId },
  });

  return NextResponse.json({ success: true });
}

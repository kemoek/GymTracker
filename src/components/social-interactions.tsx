'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  useToggleFistBump,
  useWorkoutComments,
  useAddWorkoutComment,
  useDeleteWorkoutComment,
} from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Trash2, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialInteractionsProps {
  workoutId: string;
  initialFistBumpCount?: number;
  initialHasFistBumped?: boolean;
  initialFistBumps?: { id: string; username: string }[];
  initialCommentCount?: number;
}

export function SocialInteractions({
  workoutId,
  initialFistBumpCount = 0,
  initialHasFistBumped = false,
  initialFistBumps = [],
  initialCommentCount = 0,
}: SocialInteractionsProps) {
  const { data: session } = useSession();
  const { locale, formatRelativeDate } = useLanguage();

  const [hasBumped, setHasBumped] = useState(initialHasFistBumped);
  const [bumpCount, setBumpCount] = useState(initialFistBumpCount);
  const [bumping, setBumping] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const toggleFistBump = useToggleFistBump();
  const { data: comments, isLoading: commentsLoading } = useWorkoutComments(
    showComments ? workoutId : ''
  );
  const addComment = useAddWorkoutComment(workoutId);
  const deleteComment = useDeleteWorkoutComment(workoutId);

  const handleBump = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const nextBumped = !hasBumped;
    setHasBumped(nextBumped);
    setBumpCount((prev) => (nextBumped ? prev + 1 : Math.max(0, prev - 1)));
    setBumping(true);
    setTimeout(() => setBumping(false), 400);

    try {
      const res = await toggleFistBump.mutateAsync(workoutId);
      setHasBumped(res.hasFistBumped);
      setBumpCount(res.count);
    } catch {
      // Revert on error
      setHasBumped(!nextBumped);
      setBumpCount((prev) => (!nextBumped ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleToggleComments = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleSendComment = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = commentText.trim();
    if (!text || addComment.isPending) return;

    setCommentError('');
    try {
      await addComment.mutateAsync(text);
      setCommentText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (locale === 'tr' ? 'Yorum gönderilemedi' : 'Failed to send comment');
      setCommentError(msg);
    }
  };

  const handleDelete = async (e: React.MouseEvent, commentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteComment.mutateAsync(commentId);
  };

  const currentCommentCount = comments ? comments.length : initialCommentCount;

  return (
    <div className="pt-2 mt-1 border-t border-border/40">
      <div className="flex items-center gap-2">
        {/* Fist Bump Button */}
        <button
          type="button"
          onClick={handleBump}
          title={
            initialFistBumps.length > 0
              ? initialFistBumps.map((u) => u.username).join(', ')
              : undefined
          }
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all select-none',
            hasBumped
              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
          )}
        >
          <span className={cn('text-sm inline-block transition-transform', bumping && 'scale-125')}>
            👊
          </span>
          <span>{bumpCount > 0 ? bumpCount : locale === 'tr' ? 'Yumruk Çak' : 'Fist Bump'}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={handleToggleComments}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all select-none',
            showComments
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{currentCommentCount > 0 ? currentCommentCount : locale === 'tr' ? 'Yorum' : 'Comment'}</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="mt-3 pt-2.5 border-t border-border/40 space-y-2.5 animate-in fade-in"
        >
          {commentsLoading ? (
            <p className="text-xs text-muted-foreground">
              {locale === 'tr' ? 'Yorumlar yükleniyor...' : 'Loading comments...'}
            </p>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 text-xs bg-muted/40 p-2 rounded-lg">
                  <div className="flex items-start gap-2 min-w-0">
                    <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                      <AvatarFallback className="text-[9px]">
                        {c.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">{c.user.username}</span>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeDate(c.createdAt.slice(0, 10))}</span>
                      </div>
                      <p className="text-muted-foreground break-words mt-0.5">{c.content}</p>
                    </div>
                  </div>

                  {session?.user?.id === c.userId && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, c.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title={locale === 'tr' ? 'Yorumu Sil' : 'Delete'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {locale === 'tr' ? 'İlk tebrik yorumunu sen yap! 💪' : 'Be the first to congratulate! 💪'}
            </p>
          )}

          {/* New Comment Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSendComment(e);
            }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-1.5">
              <Input
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (commentError) setCommentError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSendComment(e);
                  }
                }}
                placeholder={locale === 'tr' ? 'Tebrik et veya yorum yaz...' : 'Add a comment...'}
                className="h-8 text-xs"
                maxLength={200}
                disabled={addComment.isPending}
              />
              <Button
                type="button"
                size="sm"
                disabled={!commentText.trim() || addComment.isPending}
                className="h-8 px-2.5 gap-1 shrink-0 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendComment(e);
                }}
              >
                {addComment.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
            {commentError && (
              <p className="text-[11px] text-destructive font-medium pl-1 animate-in fade-in">
                {commentError}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLeaderboard, type LeaderboardEntry } from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Flame, Calendar, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeaderboardCard({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useLeaderboard();
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'streak'>('weekly');

  const list: LeaderboardEntry[] =
    activeTab === 'weekly'
      ? data?.weeklyRanking || []
      : activeTab === 'monthly'
      ? data?.monthlyRanking || []
      : data?.streakRanking || [];

  const displayList = compact ? list.slice(0, 5) : list;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm font-bold text-xs">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 shadow-sm font-bold text-xs">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 shadow-sm font-bold text-xs">
            🥉
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">
            #{rank}
          </div>
        );
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              {locale === 'tr' ? 'Arkadaşlar Liderlik Tablosu' : 'Friends Leaderboard'}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === 'tr'
                ? 'Arkadaşlarınla haftalık antrenman yarışı ve istikrar ligi'
                : 'Compete with your friends on weekly workouts and streaks'}
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg self-start sm:self-auto text-xs">
            <button
              onClick={() => setActiveTab('weekly')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all',
                activeTab === 'weekly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {locale === 'tr' ? 'Bu Hafta' : 'This Week'}
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all',
                activeTab === 'monthly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {locale === 'tr' ? 'Bu Ay' : 'This Month'}
            </button>
            <button
              onClick={() => setActiveTab('streak')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1',
                activeTab === 'streak'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Flame className="h-3 w-3 text-orange-400" />
              {locale === 'tr' ? 'Seri' : 'Streak'}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>{locale === 'tr' ? 'Henüz liderlik sıralamasında kimse yok.' : 'No leaderboard data yet.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayList.map((entry) => {
              const isFirst = entry.rank === 1;
              return (
                <div
                  key={entry.user.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    entry.isSelf
                      ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                      : isFirst
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(entry.rank)}

                    <Link
                      href={entry.isSelf ? '/profile' : `/users/${entry.user.id}`}
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-semibold">
                          {entry.user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {entry.user.username}
                          </p>
                          {entry.isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary">
                              {locale === 'tr' ? 'Sen' : 'You'}
                            </span>
                          )}
                          {isFirst && (
                            <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {locale === 'tr' ? `Hedef: ${entry.weeklyGoal} gün/hafta` : `Goal: ${entry.weeklyGoal} days/wk`}
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="text-right shrink-0">
                    {activeTab === 'weekly' && (
                      <div>
                        <span className="text-sm sm:text-base font-bold text-foreground">
                          {entry.workoutsThisWeek}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {locale === 'tr' ? 'idman' : 'workouts'}
                        </span>
                      </div>
                    )}
                    {activeTab === 'monthly' && (
                      <div>
                        <span className="text-sm sm:text-base font-bold text-foreground">
                          {entry.workoutsThisMonth}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {locale === 'tr' ? 'idman' : 'workouts'}
                        </span>
                      </div>
                    )}
                    {activeTab === 'streak' && (
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-400 shrink-0" />
                        <span className="text-sm sm:text-base font-bold text-foreground">
                          {entry.currentStreak}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {locale === 'tr' ? 'gün' : 'days'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

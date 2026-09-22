'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useFriendActivity } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Trophy, Target, Sparkles, Rocket, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MotivationalNudgeProps {
  activeDaysThisWeek: number;
  weeklyGoal: number;
  currentStreak: number;
}

const QUOTES_TR = [
  'Bahaneler kalori yakmaz. Salona adım attığın an en zor kısmı geride bıraktın.',
  'Büyük hedefler, küçük günlük disiplinlerin birikimidir.',
  'Bugün yapacağın zorlu set, yarınki gücünün temelidir.',
  'Yorulduğunda değil, bitirdiğinde dur.',
  'En iyi antrenman, canın hiç istemezken gidip tamamladığın antrenmandır.',
];

const QUOTES_EN = [
  'Excuses don’t burn calories. Stepping into the gym is half the battle won.',
  'Small daily disciplines create extraordinary results.',
  'The pain of discipline weighs ounces, regret weighs tons.',
  'Don’t stop when you’re tired. Stop when you’re done.',
  'The best workout is the one you did when you least felt like it.',
];

export function MotivationalNudge({
  activeDaysThisWeek,
  weeklyGoal,
  currentStreak,
}: MotivationalNudgeProps) {
  const { locale } = useLanguage();
  const { data: friendActivity } = useFriendActivity();

  // Pick quote based on day of month to rotate daily
  const dailyQuote = useMemo(() => {
    const day = new Date().getDate();
    const list = locale === 'tr' ? QUOTES_TR : QUOTES_EN;
    return list[day % list.length];
  }, [locale]);

  // Check recent friend workout (yesterday or today)
  const recentFriend = useMemo(() => {
    if (!friendActivity || friendActivity.length === 0) return null;
    return friendActivity[0];
  }, [friendActivity]);

  // Determine nudge state
  const nudge = useMemo(() => {
    const isGoalReached = activeDaysThisWeek >= weeklyGoal;
    const isOneAway = activeDaysThisWeek === weeklyGoal - 1 && weeklyGoal > 1;
    const isZero = activeDaysThisWeek === 0;

    if (isGoalReached) {
      return {
        icon: Trophy,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
        title: locale === 'tr' ? 'Şampiyon Modu Açık! 🏆' : 'Champion Mode Activated! 🏆',
        desc:
          locale === 'tr'
            ? `Tebrikler! Bu haftaki ${weeklyGoal} günlük hedefini başarıyla tamamladın. Şimdi ekstra gelişim zamanı!`
            : `Awesome job! You reached your ${weeklyGoal}-day weekly goal. Every extra session is pure bonus!`,
      };
    }

    if (isOneAway) {
      return {
        icon: Target,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        title: locale === 'tr' ? 'Hedefe Son 1 Adım Kaldı! 🎯' : 'Just 1 Workout Away! 🎯',
        desc:
          locale === 'tr'
            ? `Haftalık hedefini tamamlamak için sadece 1 antrenman kaldı (${activeDaysThisWeek}/${weeklyGoal}). Bu haftayı zaferle kapat!`
            : `Only 1 more workout needed to hit your weekly goal (${activeDaysThisWeek}/${weeklyGoal}). Finish strong!`,
      };
    }

    if (isZero) {
      return {
        icon: Rocket,
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
        title: locale === 'tr' ? 'Haftaya Güçlü Başla! 🚀' : 'Start the Week Strong! 🚀',
        desc:
          locale === 'tr'
            ? 'Henüz bu hafta antrenman kaydetmedin. İlk adımı bugün atarak ritmini yakala!'
            : 'No workouts logged yet this week. Take the first step today and set the tone!',
      };
    }

    if (currentStreak >= 3) {
      return {
        icon: Flame,
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
        title:
          locale === 'tr'
            ? `${currentStreak} Günlük Seri Yakaladın! 🔥`
            : `${currentStreak}-Day Streak Going! 🔥`,
        desc:
          locale === 'tr'
            ? 'İstikrarın harika gidiyor. Tempoyu düşürmeden seriyi devam ettir!'
            : 'Your consistency is inspiring. Keep the momentum alive!',
      };
    }

    return {
      icon: Sparkles,
      color: 'text-primary bg-primary/10 border-primary/25',
      title: locale === 'tr' ? 'Hedefe Doğru İlerle! ⚡' : 'Keep Pushing Forward! ⚡',
      desc:
        locale === 'tr'
          ? `Bu hafta ${activeDaysThisWeek}/${weeklyGoal} tamamlandı. Her antrenman seni daha güçlü yapıyor.`
          : `${activeDaysThisWeek}/${weeklyGoal} completed this week. Every workout makes you stronger.`,
    };
  }, [activeDaysThisWeek, weeklyGoal, currentStreak, locale]);

  const Icon = nudge.icon;

  return (
    <Card className="border-border/70 bg-gradient-to-r from-card via-card to-accent/20 overflow-hidden shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                nudge.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                {nudge.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {nudge.desc}
              </p>
            </div>
          </div>

          {/* Social Buddy Nudge or Daily Quote */}
          <div className="md:border-l md:border-border/60 md:pl-4 flex flex-col justify-center min-w-[240px] text-xs">
            {recentFriend ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground truncate">
                  {locale === 'tr' ? (
                    <>
                      <strong className="text-foreground">{recentFriend.user.username}</strong> yakın zamanda antrenman yaptı! 🥊
                    </>
                  ) : (
                    <>
                      <strong className="text-foreground">{recentFriend.user.username}</strong> completed a workout! 🥊
                    </>
                  )}
                </span>
              </div>
            ) : (
              <p className="italic text-muted-foreground/80 line-clamp-2">
                &ldquo;{dailyQuote}&rdquo;
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

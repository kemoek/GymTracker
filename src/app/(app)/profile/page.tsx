'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile, useUpdateProfile, useChangePassword, useUpdateGoal, useWorkouts } from '@/lib/hooks';
import { SocialInteractions } from '@/components/social-interactions';
import { useLanguage } from '@/lib/i18n';
import { updateProfileSchema, changePasswordSchema, type MuscleGroup } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Lock, Target, LogOut, Calendar, Dumbbell, Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

type ProfileForm = z.infer<typeof updateProfileSchema>;
type PasswordForm = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateGoal = useUpdateGoal();
  const { t, locale, setLocale, getMuscleGroupLabel, formatRelativeDate } = useLanguage();
  const { data: recentWorkouts } = useWorkouts({ limit: 5 });

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [goalValue, setGoalValue] = useState<number | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(updateProfileSchema),
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileMsg({ type: '', text: '' });
    try {
      await updateProfile.mutateAsync(data);
      setProfileMsg({ type: 'success', text: t.profile.profileUpdated });
      setEditingUsername(false);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : t.auth.unexpectedError });
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordMsg({ type: '', text: '' });
    try {
      await changePassword.mutateAsync(data);
      setPasswordMsg({ type: 'success', text: t.profile.passwordChanged });
      passwordForm.reset();
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : t.auth.unexpectedError });
    }
  };

  const handleGoalUpdate = async (val: number) => {
    if (val >= 1 && val <= 7) {
      await updateGoal.mutateAsync(val);
      setGoalValue(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t.friends.loading}</p>
      </div>
    );
  }

  const currentGoal = goalValue ?? profile?.weeklyGoal ?? 4;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-4 px-1">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-lg font-bold">
            {profile?.username?.slice(0, 2).toUpperCase() || '??'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{profile?.username}</h1>
          <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString(
                    locale === 'tr' ? 'tr-TR' : 'en-US',
                    { month: 'short', year: 'numeric' }
                  )
                : '—'}
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {profile?.workoutCount || 0} {t.profile.workouts}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Card — compact rows */}
      <Card>
        <CardContent className="p-0 divide-y divide-border/50">
          {/* Language */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>{t.profile.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLocale('tr')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  locale === 'tr'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                🇹🇷 TR
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  locale === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          {/* Username */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{t.profile.username}</span>
              </div>
              {!editingUsername && (
                <button
                  type="button"
                  onClick={() => setEditingUsername(true)}
                  className="text-xs text-primary hover:underline"
                >
                  {profile?.username}
                </button>
              )}
            </div>
            {editingUsername && (
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-2">
                {profileMsg.text && (
                  <p className={cn('text-xs mb-2', profileMsg.type === 'success' ? 'text-primary' : 'text-destructive')}>
                    {profileMsg.text}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    defaultValue={profile?.username}
                    {...profileForm.register('username')}
                    className="h-8 text-sm flex-1"
                  />
                  <Button type="submit" size="sm" className="h-8 px-3" disabled={updateProfile.isPending}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => { setEditingUsername(false); setProfileMsg({ type: '', text: '' }); }}
                  >
                    {locale === 'tr' ? 'İptal' : 'Cancel'}
                  </Button>
                </div>
                {profileForm.formState.errors.username && (
                  <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.username.message}</p>
                )}
              </form>
            )}
          </div>

          {/* Weekly Goal */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{t.profile.weeklyGoal}</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setGoalValue(n);
                    handleGoalUpdate(n);
                  }}
                  className={cn(
                    'w-7 h-7 rounded-md text-xs font-semibold transition-colors',
                    n === currentGoal
                      ? 'bg-primary text-primary-foreground'
                      : n <= currentGoal
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Change Password — collapsible */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center justify-between w-full text-sm"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span>{t.profile.changePassword}</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', showPasswordForm && 'rotate-180')} />
            </button>
            {showPasswordForm && (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-3 space-y-3">
                {passwordMsg.text && (
                  <p className={cn('text-xs', passwordMsg.type === 'success' ? 'text-primary' : 'text-destructive')}>
                    {passwordMsg.text}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs">{t.profile.currentPassword}</Label>
                  <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} className="h-8 text-sm" />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs">{t.profile.newPassword}</Label>
                  <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} className="h-8 text-sm" />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmNewPassword" className="text-xs">{t.profile.confirmNewPassword}</Label>
                  <Input id="confirmNewPassword" type="password" {...passwordForm.register('confirmNewPassword')} className="h-8 text-sm" />
                  {passwordForm.formState.errors.confirmNewPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmNewPassword.message}</p>
                  )}
                </div>
                <Button type="submit" size="sm" className="h-8" disabled={changePassword.isPending}>
                  {changePassword.isPending ? t.profile.saving : t.profile.changePassword}
                </Button>
              </form>
            )}
          </div>

          {/* Sign Out */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-sm text-destructive hover:underline"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.profile.signOut}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Workouts with Social Interactions */}
      {recentWorkouts && recentWorkouts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Dumbbell className="h-3.5 w-3.5" />
              {locale === 'tr' ? 'Son Antrenmanlarım' : 'My Recent Workouts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {workout.muscleGroups
                            .map((mg) => getMuscleGroupLabel(mg as MuscleGroup))
                            .join(' + ')}
                        </p>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatRelativeDate(workout.date)}
                        </span>
                      </div>
                      {workout.buddies && workout.buddies.length > 0 && (
                        <p className="text-[11px] text-primary font-medium flex items-center gap-1 mt-0.5">
                          🤝 {workout.buddies.map((b) => b.username).join(', ')}
                        </p>
                      )}
                      {workout.note && (
                        <p className="text-[11px] text-muted-foreground mt-1">💬 {workout.note}</p>
                      )}
                    </div>
                  </div>
                  <SocialInteractions
                    workoutId={workout.id}
                    initialFistBumpCount={workout.fistBumpCount || 0}
                    initialHasFistBumped={workout.hasFistBumped || false}
                    initialFistBumps={workout.fistBumps || []}
                    initialCommentCount={workout.commentCount || 0}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

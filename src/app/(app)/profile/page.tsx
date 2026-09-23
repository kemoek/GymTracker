'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile, useUpdateProfile, useChangePassword, useUpdateGoal, useWorkouts } from '@/lib/hooks';
import { SocialInteractions } from '@/components/social-interactions';
import { useLanguage, Locale } from '@/lib/i18n';
import { updateProfileSchema, changePasswordSchema, type MuscleGroup } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Lock, Target, LogOut, Calendar, Dumbbell, Globe } from 'lucide-react';
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
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : t.auth.unexpectedError });
    }
  };

  const handleGoalUpdate = async () => {
    if (goalValue && goalValue >= 1 && goalValue <= 7) {
      await updateGoal.mutateAsync(goalValue);
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.profile.title}</h1>

      {/* Profile Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {profile?.username?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{profile?.username}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {t.profile.joined}{' '}
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(
                        locale === 'tr' ? 'tr-TR' : 'en-US',
                        { month: 'long', year: 'numeric' }
                      )
                    : '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {profile?.workoutCount || 0} {t.profile.workouts}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t.profile.language}
          </CardTitle>
          <CardDescription>{t.profile.languageDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={locale === 'tr' ? 'default' : 'outline'}
              onClick={() => setLocale('tr')}
              className="gap-2"
            >
              🇹🇷 Türkçe
            </Button>
            <Button
              type="button"
              variant={locale === 'en' ? 'default' : 'outline'}
              onClick={() => setLocale('en')}
              className="gap-2"
            >
              🇬🇧 English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t.profile.editProfile}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            {profileMsg.text && (
              <div className={`rounded-lg p-3 text-sm ${profileMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {profileMsg.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">{t.profile.username}</Label>
              <Input
                id="username"
                defaultValue={profile?.username}
                {...profileForm.register('username')}
              />
              {profileForm.formState.errors.username && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.username.message}</p>
              )}
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? t.profile.saving : t.profile.saveChanges}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Weekly Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t.profile.weeklyGoal}
          </CardTitle>
          <CardDescription>{t.profile.goalDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={7}
              value={goalValue ?? profile?.weeklyGoal ?? 4}
              onChange={(e) => setGoalValue(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">{t.profile.workoutsPerWeek}</span>
            <Button
              onClick={handleGoalUpdate}
              disabled={updateGoal.isPending || goalValue === null}
              size="sm"
            >
              {updateGoal.isPending ? t.profile.saving : t.profile.update}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t.profile.changePassword}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {passwordMsg.text && (
              <div className={`rounded-lg p-3 text-sm ${passwordMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {passwordMsg.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t.profile.currentPassword}</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.profile.newPassword}</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">{t.profile.confirmNewPassword}</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                {...passwordForm.register('confirmNewPassword')}
              />
              {passwordForm.formState.errors.confirmNewPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmNewPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? t.profile.saving : t.profile.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Workouts with Social Interactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            {locale === 'tr' ? 'Son Antrenmanlarım' : 'My Recent Workouts'}
          </CardTitle>
          <CardDescription>
            {locale === 'tr'
              ? 'Arkadaşlarının yaptığı 👊 ve 💬 burada görünür'
              : 'See 👊 fist bumps and 💬 comments from friends'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recentWorkouts || recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {locale === 'tr' ? 'Henüz antrenman yok.' : 'No workouts yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="p-3.5 rounded-lg bg-muted/50 border border-border/40">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {workout.muscleGroups
                            .map((mg) => getMuscleGroupLabel(mg as MuscleGroup))
                            .join(' + ')}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeDate(workout.date)}
                        </span>
                      </div>
                      {workout.buddies && workout.buddies.length > 0 && (
                        <p className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
                          <span>🤝</span>
                          <span>
                            {workout.buddies.map((b) => b.username).join(', ')}{' '}
                            {locale === 'tr' ? 'ile birlikte' : 'with'}
                          </span>
                        </p>
                      )}
                      {workout.note && (
                        <p className="text-xs text-muted-foreground mt-1 bg-background/50 rounded p-2 border border-border/20">
                          💬 {workout.note}
                        </p>
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
          )}
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t.profile.signOut}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

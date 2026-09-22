'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { RecommendationResult } from './recommendation';

// Generic fetch helper
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// ---- User / Profile ----

export function useProfile() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<{
      id: string;
      username: string;
      email: string;
      avatarUrl: string | null;
      weeklyGoal: number;
      createdAt: string;
      workoutCount: number;
    }>('/api/users/me'),
    enabled: status === 'authenticated',
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { username?: string; avatarUrl?: string | null }) =>
      apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
      apiFetch('/api/users/me/password', { method: 'PUT', body: JSON.stringify(data) }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weeklyGoal: number) =>
      apiFetch('/api/users/me/goal', { method: 'PUT', body: JSON.stringify({ weeklyGoal }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// ---- Workouts ----

export interface Workout {
  id: string;
  userId: string;
  date: string;
  note: string | null;
  muscleGroups: string[];
  createdAt: string;
  updatedAt: string;
}

export function useWorkouts(params?: { month?: string; from?: string; to?: string; limit?: number }) {
  const { status } = useSession();
  const searchParams = new URLSearchParams();
  if (params?.month) searchParams.set('month', params.month);
  if (params?.from) searchParams.set('from', params.from);
  if (params?.to) searchParams.set('to', params.to);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const url = `/api/workouts${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: ['workouts', params],
    queryFn: () => apiFetch<Workout[]>(url),
    enabled: status === 'authenticated',
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => apiFetch<Workout>(`/api/workouts/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; muscleGroups: string[]; note?: string }) =>
      apiFetch<Workout>('/api/workouts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; date: string; muscleGroups: string[]; note?: string }) =>
      apiFetch<Workout>(`/api/workouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/workouts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// ---- Statistics ----

export interface Statistics {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  workoutsLast7Days: number;
  workoutsLast30Days: number;
  activeDaysThisWeek: number;
  currentStreak: number;
  longestStreak: number;
  avgPerWeek: number;
  muscleGroupDistribution: { muscleGroup: string; count: number; percentage: number }[];
  weeklyData: { week: string; count: number }[];
  monthlyData: { month: string; count: number }[];
  heatmapData: { date: string; count: number }[];
}

export function useStatistics() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['statistics'],
    queryFn: () => apiFetch<Statistics>('/api/statistics'),
    enabled: status === 'authenticated',
  });
}

// ---- Friends ----

export interface Friend {
  friendshipId: string;
  user: { id: string; username: string; avatarUrl: string | null };
  workoutsThisWeek: number;
  lastWorkout: { date: string; muscleGroups: string[] } | null;
}

export function useFriends() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => apiFetch<Friend[]>('/api/friends'),
    enabled: status === 'authenticated',
  });
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  requester: { id: string; username: string; avatarUrl: string | null };
}

export function useFriendRequests() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['friendRequests'],
    queryFn: () => apiFetch<FriendRequest[]>('/api/friends/requests'),
    enabled: status === 'authenticated',
    refetchInterval: 15000,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      apiFetch('/api/friends/requests', { method: 'POST', body: JSON.stringify({ username }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/friends/requests/${id}/accept`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/friends/requests/${id}/reject`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      apiFetch(`/api/friends/${friendshipId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export interface FriendActivity {
  id: string;
  user: { id: string; username: string; avatarUrl: string | null };
  date: string;
  muscleGroups: string[];
}

export function useFriendActivity() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['friendActivity'],
    queryFn: () => apiFetch<FriendActivity[]>('/api/friends/activity'),
    enabled: status === 'authenticated',
  });
}

export interface FriendComparison {
  user: { id: string; username: string; avatarUrl: string | null };
  weeklyCount: number;
  monthlyCount: number;
}

export function useFriendComparison() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['friendComparison'],
    queryFn: () => apiFetch<FriendComparison[]>('/api/friends/comparison'),
    enabled: status === 'authenticated',
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => apiFetch<{ id: string; username: string; avatarUrl: string | null }[]>(`/api/users/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}

export interface UserProfileDetail {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    weeklyGoal: number;
    createdAt: string;
  };
  isSelf: boolean;
  isFriend: boolean;
  friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED';
  statistics: {
    totalWorkouts: number;
    workoutsThisWeek: number;
    workoutsThisMonth: number;
    activeDaysThisWeek: number;
    currentStreak: number;
    longestStreak: number;
    avgPerWeek: number;
    muscleGroupDistribution: { muscleGroup: string; count: number; percentage: number }[];
    heatmapData: { date: string; count: number }[];
    recentWorkouts: {
      id: string;
      date: string;
      note: string | null;
      muscleGroups: string[];
    }[];
  };
}

export function useUserProfile(id: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: ['userProfile', id],
    queryFn: () => apiFetch<UserProfileDetail>(`/api/users/${id}`),
    enabled: status === 'authenticated' && !!id,
  });
}

// ---- Routine ----

export interface RoutineDayItem {
  dayOfWeek: number; // 1..7
  isRestDay: boolean;
  title: string | null;
  muscleGroups: string[];
  notes?: string;
}

export function useRoutine() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['routine'],
    queryFn: () => apiFetch<{ routine: RoutineDayItem[] }>('/api/routine'),
    enabled: status === 'authenticated',
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { days: RoutineDayItem[] }) =>
      apiFetch('/api/routine', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine'] });
    },
  });
}

export function useApplyRoutinePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preset: 'ppl' | 'upper_lower' | 'bro_split' | 'full_body') =>
      apiFetch('/api/routine/preset', { method: 'POST', body: JSON.stringify({ preset }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine'] });
    },
  });
}

export function useUserRoutine(userId: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: ['userRoutine', userId],
    queryFn: () => apiFetch<{ routine: RoutineDayItem[] }>(`/api/users/${userId}/routine`),
    enabled: status === 'authenticated' && !!userId,
  });
}

// ---- Recommendation ----

export function useRecommendation(date?: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: ['recommendation', date || 'today'],
    queryFn: () =>
      apiFetch<RecommendationResult>(
        date ? `/api/recommendation?date=${date}` : '/api/recommendation'
      ),
    enabled: status === 'authenticated',
  });
}

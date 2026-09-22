'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useFriends,
  useFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useFriendComparison,
  useSearchUsers,
} from '@/lib/hooks';
import { useLanguage } from '@/lib/i18n';
import { type MuscleGroup } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, UserMinus, Check, X, Search, Users, Trophy } from 'lucide-react';
import { LeaderboardCard } from '@/components/leaderboard-card';

export default function FriendsPage() {
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests } = useFriendRequests();
  const { data: comparison } = useFriendComparison();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults } = useSearchUsers(searchQuery);
  const { t, formatRelativeDate, getMuscleGroupLabel } = useLanguage();

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();

  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  const handleSendRequest = async (username: string) => {
    setSendError('');
    setSendSuccess('');
    try {
      await sendRequest.mutateAsync(username);
      setSendSuccess(`${t.friends.requestSent} ${username}`);
      setSearchQuery('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send request');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.friends.title}</h1>

      <Tabs defaultValue="friends">
        <TabsList className="w-full">
          <TabsTrigger value="friends" className="flex-1">
            {t.friends.tabs.friends}
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1">
            {t.friends.tabs.leaderboard}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 relative">
            {t.friends.tabs.requests}
            {requests && requests.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse shadow-sm">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex-1">
            {t.friends.tabs.compare}
          </TabsTrigger>
          <TabsTrigger value="add" className="flex-1">
            {t.friends.tabs.add}
          </TabsTrigger>
        </TabsList>

        {/* Friends List */}
        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t.friends.yourFriends} ({friends?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friendsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t.friends.loading}</p>
              ) : !friends || friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t.friends.noFriends}
                </p>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div key={friend.friendshipId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-accent/40 transition-colors">
                      <Link href={`/users/${friend.user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{friend.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold hover:text-primary transition-colors">{friend.user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {friend.workoutsThisWeek} {t.dashboard.workouts} {t.friends.workoutsThisWeek}
                            {friend.lastWorkout && (
                              <> • {t.friends.lastPrefix}: {formatRelativeDate(friend.lastWorkout.date)}</>
                            )}
                          </p>
                          {friend.lastWorkout && (
                            <p className="text-xs text-muted-foreground">
                              {friend.lastWorkout.muscleGroups
                                .map((mg) => getMuscleGroupLabel(mg as MuscleGroup))
                                .join(' + ')}
                            </p>
                          )}
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => {
                          if (confirm(`${friend.user.username} ${t.friends.removeConfirm}`)) {
                            removeFriend.mutate(friend.friendshipId);
                          }
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friend Requests */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.friends.pendingRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              {!requests || requests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t.friends.noRequests}
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Link href={`/users/${req.requester.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{req.requester.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium hover:text-primary transition-colors">{req.requester.username}</p>
                          <p className="text-xs text-muted-foreground">{t.friends.wantsToBeFriend}</p>
                        </div>
                      </Link>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => acceptRequest.mutate(req.id)}
                          className="gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t.friends.accept}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectRequest.mutate(req.id)}
                          className="gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t.friends.reject}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <LeaderboardCard />
        </TabsContent>

        {/* Comparison */}
        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {t.friends.weeklyComparison}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!comparison || comparison.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t.friends.noComparison}
                </p>
              ) : (
                <div className="space-y-3">
                  {comparison.map((item, index) => (
                    <Link
                      key={item.user.id}
                      href={`/users/${item.user.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-accent/40 transition-colors cursor-pointer"
                    >
                      <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                        {index + 1}
                      </span>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{item.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium hover:text-primary transition-colors">{item.user.username}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{item.weeklyCount}</p>
                        <p className="text-xs text-muted-foreground">{t.friends.thisWeek}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{item.monthlyCount}</p>
                        <p className="text-xs text-muted-foreground">{t.friends.thisMonth}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Friend */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t.friends.addFriend}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sendError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {sendError}
                </div>
              )}
              {sendSuccess && (
                <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
                  {sendSuccess}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.friends.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSendError('');
                    setSendSuccess('');
                  }}
                  className="pl-9"
                />
              </div>

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Link href={`/users/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium hover:text-primary transition-colors">{user.username}</p>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.username)}
                        disabled={sendRequest.isPending}
                        className="gap-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {t.friends.tabs.add}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  "{searchQuery}" {t.friends.noUsersFound}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

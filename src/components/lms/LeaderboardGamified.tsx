import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Shield } from 'lucide-react';
import { useGamificationGamified } from './GamificationServiceGamified';

export const LeaderboardGamified = () => {
  const { getLeaderboard, userProgress } = useGamificationGamified();
  const leaderboard = getLeaderboard();

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className='h-5 w-5 text-yellow-500' />;
      case 1:
        return <Trophy className='h-5 w-5 text-gray-400' />;
      case 2:
        return <Medal className='h-5 w-5 text-orange-500' />;
      default:
        return <span className='font-bold text-gray-500'>#{index + 1}</span>;
    }
  };

  const getUserName = (userId: string) => {
    const names: Record<string, string> = {
      '1': 'Sarah Johnson',
      '2': 'Mike Chen',
      '3': 'Emma Wilson',
      'current-user': 'You',
    };
    return names[userId] ?? `User ${userId}`;
  };

  return (
    <Card className='security-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5 text-yellow-500' /> Leaderboard
          <Shield className='h-4 w-4 text-csword-gold ml-auto' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {leaderboard.map((user, index) => (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                user.userId === userProgress.userId ? 'border-[#907527] bg-[#f5f3e8]' : 'border-gray-200'
              }`}
            >
              <div className='flex items-center justify-center w-8'>{getRankIcon(index)}</div>
              <Avatar className='h-10 w-10'>
                <AvatarFallback>{getUserName(user.userId).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <p className='font-medium'>{getUserName(user.userId)}</p>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <span>Level {user.level}</span>
                  <span>•</span>
                  <span>{user.completedCourses} courses</span>
                  <span>•</span>
                  <span>{user.streak} day streak</span>
                </div>
              </div>
              <div className='text-right'>
                <Badge variant='outline' className='font-bold'>
                  {user.totalPoints.toLocaleString()} pts
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardGamified;

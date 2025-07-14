import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Flame, Target, Battery, Award, TrendingUp, Calendar, Shield } from 'lucide-react';
import { useGamificationGamified } from './GamificationServiceGamified';

export const UserProgressDashboardGamified = () => {
  const { userProgress } = useGamificationGamified();

  const pointsToNextLevel = userProgress.level * 200 - userProgress.totalPoints;
  const progressToNextLevel = ((userProgress.totalPoints % 200) / 200) * 100;
  const weeklyGoalProgress = (userProgress.weeklyProgress / userProgress.weeklyGoal) * 100;
  const energyPercentage = (userProgress.energyPoints / userProgress.maxEnergy) * 100;

  const statisticCard = (
    colorFrom: string,
    colorTo: string,
    title: string,
    value: React.ReactNode,
    icon: JSX.Element,
  ) => (
    <Card className={`bg-gradient-to-br ${colorFrom} ${colorTo} text-white`}> 
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='opacity-80'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 security-card'>
      {/* Level */}
      <Card className='bg-gradient-to-br from-purple-500 to-purple-600 text-white'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100'>Level</p>
              <p className='text-2xl font-bold'>{userProgress.level}</p>
            </div>
            <Star className='h-8 w-8 text-purple-200' />
          </div>
          <div className='mt-3'>
            <Progress value={progressToNextLevel} className='h-2' />
            <p className='text-xs text-purple-100 mt-1'>
              {pointsToNextLevel} points to level {userProgress.level + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Points */}
      {statisticCard('from-yellow-500', 'to-yellow-600', 'Total Points', userProgress.totalPoints.toLocaleString(), <Trophy className='h-8 w-8 text-yellow-200' />)}

      {/* Streak */}
      {statisticCard('from-orange-500', 'to-orange-600', 'Current Streak', userProgress.streak, <Flame className='h-8 w-8 text-orange-200' />)}

      {/* Completed Courses */}
      {statisticCard('from-green-500', 'to-green-600', 'Completed', userProgress.completedCourses, <Target className='h-8 w-8 text-green-200' />)}

      {/* Energy */}
      <Card className='bg-gradient-to-br from-blue-500 to-blue-600 text-white'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100'>Energy</p>
              <p className='text-2xl font-bold'>
                {userProgress.energyPoints}/{userProgress.maxEnergy}
              </p>
            </div>
            <Battery className='h-8 w-8 text-blue-200' />
          </div>
          <div className='mt-3'>
            <Progress value={energyPercentage} className='h-2' />
            <p className='text-xs text-blue-100 mt-1'>Restores 1 point per hour</p>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {statisticCard('from-pink-500', 'to-pink-600', 'Badges', userProgress.badges.length, <Award className='h-8 w-8 text-pink-200' />)}

      {/* Weekly Goal */}
      <Card className='bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-indigo-100'>Weekly Goal</p>
              <p className='text-2xl font-bold'>
                {userProgress.weeklyProgress}/{userProgress.weeklyGoal}
              </p>
            </div>
            <Calendar className='h-8 w-8 text-indigo-200' />
          </div>
          <div className='mt-3'>
            <Progress value={weeklyGoalProgress} className='h-2' />
            <p className='text-xs text-indigo-100 mt-1'>
              {Math.max(0, userProgress.weeklyGoal - userProgress.weeklyProgress)} points remaining
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skills Unlocked */}
      {statisticCard('from-teal-500', 'to-teal-600', 'Skills Unlocked', userProgress.skillTree.filter((s) => s.unlocked).length, <TrendingUp className='h-8 w-8 text-teal-200' />)}
    </div>
  );
};

export default UserProgressDashboardGamified;

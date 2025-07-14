import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, Flame, Target, Shield } from 'lucide-react';
import { useGamificationGamified } from './GamificationServiceGamified';
import { useSecurityGamified } from '@/hooks/useSecurityGamified';

export const DailyChallenges = () => {
  const { userProgress, completeChallenge } = useGamificationGamified();
  const { sanitizeInput, checkApiRateLimit, auditLog } = useSecurityGamified();

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = Math.max(0, expiresAt.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(0, minutes)}m`;
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Target className='h-5 w-5 text-blue-500' />;
      case 'weekly':
        return <Flame className='h-5 w-5 text-orange-500' />;
      case 'special':
        return <Trophy className='h-5 w-5 text-purple-500' />;
      default:
        return <Target className='h-5 w-5 text-gray-500' />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-orange-100 text-orange-800';
      case 'special':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCompleteChallenge = (challengeId: string) => {
    if (!checkApiRateLimit('complete-challenge')) {
      auditLog.warn('Challenge completion rate limit exceeded');
      return;
    }
    completeChallenge(challengeId);
    auditLog.info('Challenge completed', { challengeId });
  };

  return (
    <Card className='security-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Target className='h-5 w-5 text-csword-gold' />
          Daily Challenges
          <Shield className='h-4 w-4 text-csword-gold ml-auto' title='Secure Challenge System' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {userProgress.challenges.map(challenge => (
            <div key={challenge.id} className={`p-4 rounded-lg border-2 security-card transition-all ${challenge.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:shadow-md'}`}>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-3'>
                  {getChallengeIcon(challenge.type)}
                  <div>
                    <h3 className='font-semibold'>{sanitizeInput(challenge.title)}</h3>
                    <p className='text-sm text-gray-600'>{sanitizeInput(challenge.description)}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge className={getTypeColor(challenge.type)}>{challenge.type}</Badge>
                  {!challenge.completed && (
                    <div className='flex items-center gap-1 text-sm text-gray-500'>
                      <Clock className='h-4 w-4' />
                      {formatTimeRemaining(challenge.expiresAt)}
                    </div>
                  )}
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Progress</span>
                  <span>{Math.min(challenge.current, challenge.target)}/{challenge.target}</span>
                </div>
                <Progress value={Math.min(100, (challenge.current / challenge.target) * 100)} className='h-2' />
              </div>
              <div className='flex items-center justify-between mt-3'>
                <div className='flex items-center gap-2'>
                  <Trophy className='h-4 w-4 text-yellow-500' />
                  <span className='text-sm font-medium'>{Math.max(0, challenge.reward)} points</span>
                </div>
                {challenge.completed ? (
                  <Badge className='bg-green-500 text-white'>Completed!</Badge>
                ) : challenge.current >= challenge.target ? (
                  <Button size='sm' onClick={() => handleCompleteChallenge(challenge.id)} className='bg-csword-gold hover:bg-csword-gold/90 text-white'>
                    Claim Reward
                  </Button>
                ) : (
                  <Badge variant='outline'>In Progress</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyChallenges;

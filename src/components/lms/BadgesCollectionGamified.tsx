import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Star, Shield } from 'lucide-react';
import { useGamificationGamified } from './GamificationServiceGamified';
import { useSecurityGamified } from '@/hooks/useSecurityGamified';

export const BadgesCollection = () => {
  const { userProgress } = useGamificationGamified();
  const { sanitizeInput } = useSecurityGamified();
  const sortedBadges = [...userProgress.badges].sort((a,b)=> new Date(b.earnedAt).getTime()- new Date(a.earnedAt).getTime());
  return (
    <Card className='security-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Award className='h-5 w-5 text-csword-gold' /> Badge Collection ({userProgress.badges.length})
          <Shield className='h-4 w-4 text-csword-gold ml-auto' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userProgress.badges.length===0 ? (
          <div className='text-center py-8'>
            <Award className='h-12 w-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-500'>No badges earned yet</p>
            <p className='text-sm text-gray-400'>Complete activities to earn your first badge!</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {sortedBadges.map(badge => (
              <div key={badge.id} className='p-4 rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all security-card'>
                <div className='flex items-start gap-3'>
                  <div className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center text-2xl`}>{badge.icon}</div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-900'>{sanitizeInput(badge.name)}</h3>
                    <p className='text-sm text-gray-600 mb-2'>{sanitizeInput(badge.description)}</p>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-gray-400' />
                      <span className='text-xs text-gray-500'>Earned {badge.earnedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Star className='h-5 w-5 text-yellow-500' />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgesCollection;

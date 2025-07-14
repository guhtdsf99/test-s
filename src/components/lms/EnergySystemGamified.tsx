import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Battery, Zap, Coffee, Clock, Shield } from 'lucide-react';
import { useGamificationGamified } from './GamificationServiceGamified';
import { useSecurityGamified } from '@/hooks/useSecurityGamified';

export const EnergySystem = () => {
  const { userProgress, useEnergy, restoreEnergy } = useGamificationGamified();
  const { auditLog, checkApiRateLimit } = useSecurityGamified();

  const energyPercentage = Math.max(0, Math.min(100, (userProgress.energyPoints / userProgress.maxEnergy) * 100));

  const getEnergyColor = () => {
    if (energyPercentage > 70) return 'text-green-500';
    if (energyPercentage > 30) return 'text-yellow-500';
    return 'text-red-500';
  };
  const getEnergyBgColor = () => {
    if (energyPercentage > 70) return 'bg-green-50 border-green-200';
    if (energyPercentage > 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const handleUseEnergy = () => {
    if (!checkApiRateLimit('use-energy')) {
      auditLog.warn('Energy use rate limit exceeded');
      return;
    }
    const success = useEnergy(1);
    if (!success) auditLog.info('Energy use attempt failed - insufficient energy');
  };
  const handleRestoreEnergy = () => {
    if (!checkApiRateLimit('restore-energy')) {
      auditLog.warn('Energy restore rate limit exceeded');
      return;
    }
    restoreEnergy();
    auditLog.info('Energy restored');
  };
  const timeToNextRestore = () => {
    const next = new Date();
    next.setMinutes(next.getMinutes() + (60 - (next.getMinutes() % 60)));
    const diff = next.getTime() - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60)));
  };

  return (
    <Card className={`${getEnergyBgColor()} security-card`}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <Battery className={`h-5 w-5 ${getEnergyColor()}`} /> Energy System
          <Shield className='h-4 w-4 text-csword-gold ml-auto' title='Secure System' />
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Zap className={`h-6 w-6 ${getEnergyColor()}`} />
            <span className='text-2xl font-bold'>{userProgress.energyPoints}/{userProgress.maxEnergy}</span>
          </div>
          <div className='text-right'>
            <p className='text-sm text-gray-600'>Energy Points</p>
            <p className='text-xs text-gray-500'>Required for activities</p>
          </div>
        </div>
        <Progress value={energyPercentage} className='h-3' />
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-gray-500' />
            <div>
              <p className='font-medium'>Next Restore</p><p className='text-gray-600'>{timeToNextRestore()}m</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Coffee className='h-4 w-4 text-gray-500' />
            <div>
              <p className='font-medium'>Full Restore</p><p className='text-gray-600'>{Math.max(0, userProgress.maxEnergy - userProgress.energyPoints)}h</p>
            </div>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={handleUseEnergy} disabled={userProgress.energyPoints === 0} className='flex-1'>Use Energy (-1)</Button>
          <Button size='sm' onClick={handleRestoreEnergy} className='flex-1 bg-csword-gold hover:bg-csword-gold/90 text-white'>
            <Zap className='h-4 w-4 mr-1' /> Restore All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergySystem;

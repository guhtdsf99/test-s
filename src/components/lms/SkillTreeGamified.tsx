import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Lock, Star, TrendingUp, Shield } from 'lucide-react';
import { useGamificationGamified } from './GamificationServiceGamified';

export const SkillTreeGamified = () => {
  const { userProgress, unlockSkillNode } = useGamificationGamified();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'awareness':
        return 'bg-yellow-100 text-yellow-800';
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'leadership':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canUnlock = (node: any) => {
    if (node.unlocked) return false;
    if (node.prerequisites.length === 0) return true;
    return node.prerequisites.every((prereqId: string) => {
      const prereq = userProgress.skillTree.find((n) => n.id === prereqId);
      return prereq?.unlocked && prereq?.level > 0;
    });
  };

  const groupedSkills = userProgress.skillTree.reduce((acc: Record<string, typeof userProgress.skillTree>, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof userProgress.skillTree>);

  return (
    <Card className='security-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5 text-[#907527]' /> Skill Tree
          <Shield className='h-4 w-4 text-csword-gold ml-auto' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div key={category} className='space-y-3'>
              <h3 className='font-semibold text-lg capitalize flex items-center gap-2'>
                <BookOpen className='h-5 w-5' /> {category}
              </h3>
              <div className='grid gap-3'>
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      skill.unlocked
                        ? 'border-green-200 bg-green-50'
                        : canUnlock(skill)
                        ? 'border-[#907527] bg-[#f5f3e8]'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-start gap-3'>
                        <div className='text-2xl'>
                          {skill.unlocked ? skill.icon : <Lock className='h-6 w-6 text-gray-400' />}
                        </div>
                        <div className='flex-1'>
                          <h4 className={`font-semibold ${skill.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{skill.name}</h4>
                          <p className={`text-sm ${skill.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>{skill.description}</p>
                        </div>
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        <Badge className={getCategoryColor(skill.category)}>{skill.category}</Badge>
                        {skill.unlocked && (
                          <div className='flex items-center gap-1'>
                            <Star className='h-4 w-4 text-yellow-500' />
                            <span className='text-sm font-medium'>Level {skill.level}/{skill.maxLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {skill.unlocked && (
                      <div className='space-y-2 mb-3'>
                        <div className='flex justify-between text-sm'>
                          <span>Skill Progress</span>
                          <span>
                            {skill.level}/{skill.maxLevel}
                          </span>
                        </div>
                        <Progress value={(skill.level / skill.maxLevel) * 100} className='h-2' />
                      </div>
                    )}
                    {skill.prerequisites.length > 0 && (
                      <div className='mb-3'>
                        <p className='text-xs text-gray-500 mb-1'>Prerequisites:</p>
                        <div className='flex flex-wrap gap-1'>
                          {skill.prerequisites.map((prereqId: string) => {
                            const prereq = userProgress.skillTree.find((n) => n.id === prereqId);
                            return (
                              <Badge
                                key={prereqId}
                                variant='outline'
                                className={prereq?.unlocked ? 'border-green-500 text-green-700' : ''}
                              >
                                {prereq?.name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className='flex justify-between items-center'>
                      <div className='text-sm text-gray-500'>
                        {skill.unlocked ? 'Unlocked' : canUnlock(skill) ? 'Ready to unlock' : 'Locked'}
                      </div>
                      {!skill.unlocked && canUnlock(skill) && (
                        <Button size='sm' onClick={() => unlockSkillNode(skill.id)} className='bg-[#907527] hover:bg-[#907527]/90'>
                          Unlock
                        </Button>
                      )}
                      {skill.unlocked && skill.level < skill.maxLevel && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => unlockSkillNode(skill.id)}
                          className='border-[#907527] text-[#907527] hover:bg-[#907527]/10'
                        >
                          Level Up
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillTreeGamified;

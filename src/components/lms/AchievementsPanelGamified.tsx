
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock } from 'lucide-react';
import { useGamificationGamified } from './GamificationServiceGamified';

export const AchievementsPanel = () => {
  const { userProgress } = useGamificationGamified();
  
  const unlockedAchievements = userProgress.achievements.filter(a => a.unlocked);
  const lockedAchievements = userProgress.achievements.filter(a => !a.unlocked);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Achievements ({unlockedAchievements.length}/{userProgress.achievements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userProgress.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.unlocked
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={achievement.unlocked ? "default" : "secondary"}>
                      {achievement.points} points
                    </Badge>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-xs text-gray-500">
                        Unlocked {achievement.unlockedAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsPanel;

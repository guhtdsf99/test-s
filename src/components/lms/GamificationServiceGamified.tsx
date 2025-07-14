import React, { createContext, useContext, useState } from 'react';

/* Copy of GamificationService from phish-aware-academy repo. File renamed so it does not override existing code. */

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly' | 'special';
  target: number;
  current: number;
  reward: number;
  expiresAt: Date;
  completed: boolean;
}

interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  level: number;
  maxLevel: number;
  prerequisites: string[];
  category: 'security' | 'awareness' | 'technical' | 'leadership';
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
}

interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  completedCourses: number;
  streak: number;
  achievements: Achievement[];
  challenges: Challenge[];
  skillTree: SkillNode[];
  badges: Badge[];
  weeklyGoal: number;
  weeklyProgress: number;
  energyPoints: number;
  maxEnergy: number;
  lastActiveDate: Date;
}

interface GamificationContextType {
  userProgress: UserProgress;
  addPoints: (points: number, reason: string) => void;
  unlockAchievement: (achievementId: string) => void;
  completeChallenge: (challengeId: string) => void;
  unlockSkillNode: (nodeId: string) => void;
  earnBadge: (badgeId: string) => void;
  useEnergy: (amount: number) => boolean;
  restoreEnergy: () => void;
  getLeaderboard: () => UserProgress[];
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

/* ---- static demo data (unchanged) ---- */
const mockAchievements: Achievement[] = [
  { id: 'first-course', title: 'First Steps', description: 'Complete your first training course', icon: '🎯', points: 100, unlocked: true, unlockedAt: new Date('2024-04-15'), rarity: 'common' },
  { id: 'streak-7', title: 'Week Warrior', description: 'Complete training for 7 days straight', icon: '🔥', points: 250, unlocked: true, unlockedAt: new Date('2024-04-20'), rarity: 'rare' },
  { id: 'perfect-score', title: 'Perfectionist', description: 'Score 100% on any assessment', icon: '⭐', points: 200, unlocked: false, rarity: 'epic' },
  { id: 'course-master', title: 'Course Master', description: 'Complete 5 training courses', icon: '🏆', points: 500, unlocked: false, rarity: 'legendary' },
  { id: 'speed-learner', title: 'Speed Learner', description: 'Complete a course in under 30 minutes', icon: '⚡', points: 300, unlocked: false, rarity: 'epic' },
];

const mockChallenges: Challenge[] = [
  { id: 'daily-quiz', title: 'Daily Quiz Master', description: 'Complete 3 quizzes today', icon: '🧠', type: 'daily', target: 3, current: 1, reward: 150, expiresAt: new Date(Date.now() + 24*60*60*1000), completed: false },
  { id: 'weekly-streak', title: 'Weekly Warrior', description: 'Maintain a 5-day learning streak', icon: '🔥', type: 'weekly', target: 5, current: 3, reward: 500, expiresAt: new Date(Date.now() + 7*24*60*60*1000), completed: false },
  { id: 'special-event', title: 'Cybersecurity Week', description: 'Complete 10 security modules this week', icon: '🛡️', type: 'special', target: 10, current: 4, reward: 1000, expiresAt: new Date(Date.now() + 5*24*60*60*1000), completed: false },
];

const mockSkillTree: SkillNode[] = [
  { id: 'password-basics', name: 'Password Security', description: 'Learn the fundamentals of secure passwords', icon: '🔐', unlocked: true, level: 2, maxLevel: 3, prerequisites: [], category: 'security' },
  { id: 'phishing-detection', name: 'Phishing Detection', description: 'Identify and avoid phishing attempts', icon: '🎣', unlocked: true, level: 1, maxLevel: 3, prerequisites: ['password-basics'], category: 'awareness' },
  { id: 'social-engineering', name: 'Social Engineering', description: 'Advanced awareness techniques', icon: '🕵️', unlocked: false, level: 0, maxLevel: 3, prerequisites: ['phishing-detection'], category: 'awareness' },
  { id: 'incident-response', name: 'Incident Response', description: 'Handle security incidents effectively', icon: '🚨', unlocked: false, level: 0, maxLevel: 5, prerequisites: ['social-engineering'], category: 'technical' },
];

const mockBadges: Badge[] = [
  { id: 'early-bird', name: 'Early Bird', description: 'Completed training before 9 AM', icon: '🌅', color: 'bg-yellow-500', earnedAt: new Date('2024-04-10') },
  { id: 'night-owl', name: 'Night Owl', description: 'Completed training after 10 PM', icon: '🦉', color: 'bg-purple-500', earnedAt: new Date('2024-04-12') },
];

const mockLeaderboard: UserProgress[] = [
  { userId: '1', totalPoints: 1250, level: 5, completedCourses: 8, streak: 12, achievements: mockAchievements.filter(a=>a.unlocked), challenges: [], skillTree: [], badges: [], weeklyGoal: 500, weeklyProgress: 380, energyPoints: 8, maxEnergy: 10, lastActiveDate: new Date() },
  { userId: '2', totalPoints: 980, level: 4, completedCourses: 6, streak: 7, achievements: mockAchievements.filter(a=>a.unlocked), challenges: [], skillTree: [], badges: [], weeklyGoal: 400, weeklyProgress: 340, energyPoints: 6, maxEnergy: 10, lastActiveDate: new Date() },
  { userId: '3', totalPoints: 750, level: 3, completedCourses: 4, streak: 5, achievements: mockAchievements.filter(a=>a.unlocked), challenges: [], skillTree: [], badges: [], weeklyGoal: 300, weeklyProgress: 180, energyPoints: 4, maxEnergy: 10, lastActiveDate: new Date() },
];

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    userId: 'current-user',
    totalPoints: 850,
    level: 4,
    completedCourses: 5,
    streak: 8,
    achievements: mockAchievements,
    challenges: mockChallenges,
    skillTree: mockSkillTree,
    badges: mockBadges,
    weeklyGoal: 600,
    weeklyProgress: 420,
    energyPoints: 7,
    maxEnergy: 10,
    lastActiveDate: new Date(),
  });

  const addPoints = (points: number, reason: string) => {
    setUserProgress(prev => {
      const newTotal = prev.totalPoints + points;
      const newLevel = Math.floor(newTotal / 200) + 1;
      console.log(`Added ${points} points for: ${reason}`);
      return { ...prev, totalPoints: newTotal, level: newLevel, weeklyProgress: prev.weeklyProgress + points };
    });
  };

  const unlockAchievement = (achievementId: string) => {
    setUserProgress(prev => ({
      ...prev,
      achievements: prev.achievements.map(a => a.id === achievementId ? { ...a, unlocked: true, unlockedAt: new Date() } : a),
    }));
  };

  const completeChallenge = (challengeId: string) => {
    setUserProgress(prev => {
      const challenge = prev.challenges.find(c => c.id === challengeId);
      if (challenge && !challenge.completed) {
        return {
          ...prev,
          totalPoints: prev.totalPoints + challenge.reward,
          challenges: prev.challenges.map(c => c.id === challengeId ? { ...c, completed: true, current: c.target } : c),
        };
      }
      return prev;
    });
  };

  const unlockSkillNode = (nodeId: string) => {
    setUserProgress(prev => ({
      ...prev,
      skillTree: prev.skillTree.map(n => n.id === nodeId ? { ...n, unlocked: true, level: Math.min(n.level + 1, n.maxLevel) } : n),
    }));
  };

  const earnBadge = (badgeId: string) => {
    setUserProgress(prev => ({
      ...prev,
      badges: [...prev.badges, { id: badgeId, name: 'New Badge', description: 'Achievement unlocked!', icon: '🏅', color: 'bg-blue-500', earnedAt: new Date() }],
    }));
  };

  const useEnergy = (amount: number): boolean => {
    if (userProgress.energyPoints >= amount) {
      setUserProgress(prev => ({ ...prev, energyPoints: prev.energyPoints - amount }));
      return true;
    }
    return false;
  };

  const restoreEnergy = () => {
    setUserProgress(prev => ({ ...prev, energyPoints: prev.maxEnergy }));
  };

  const getLeaderboard = () => [...mockLeaderboard, userProgress].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <GamificationContext.Provider value={{ userProgress, addPoints, unlockAchievement, completeChallenge, unlockSkillNode, earnBadge, useEnergy, restoreEnergy, getLeaderboard }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamificationGamified = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
};

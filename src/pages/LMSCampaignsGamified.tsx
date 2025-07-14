import React from 'react';
import { Link } from 'react-router-dom';
import VideoUploaderGamified from '@/components/lms/VideoUploaderGamified';
import CampaignListGamified from '@/components/lms/CampaignListGamified';
import CampaignCreatorGamified from '@/components/lms/CampaignCreatorGamified';
import { UserIntegrations } from '@/components/integrations/UserIntegrations';
import UserProgressDashboardGamified from '@/components/lms/UserProgressDashboardGamified';
import AchievementsPanelGamified from '@/components/lms/AchievementsPanelGamified';
import LeaderboardGamified from '@/components/lms/LeaderboardGamified';
import DailyChallengesGamified from '@/components/lms/DailyChallengesGamified';
import SkillTreeGamified from '@/components/lms/SkillTreeGamified';
import EnergySystemGamified from '@/components/lms/EnergySystemGamified';
import BadgesCollectionGamified from '@/components/lms/BadgesCollectionGamified';
import { GamificationProvider } from '@/components/lms/GamificationServiceGamified';
import CertificateCardGamified from '@/components/lms/CertificateCardGamified';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Award, Settings } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const LMSCampaignsGamified = () => {
  const { toast } = useToast();


  const pageContent = (
    <div className='space-y-8 w-full'>
      {/* User Progress Dashboard - Moved above tabs */}
      <UserProgressDashboardGamified />
      
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='flex flex-wrap w-full'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='challenges'>Challenges</TabsTrigger>
          <TabsTrigger value='skills'>Skill Tree</TabsTrigger>
          <TabsTrigger value='energy'>Energy</TabsTrigger>
          <TabsTrigger value='videos'>Videos</TabsTrigger>
          <TabsTrigger value='campaigns'>Campaigns</TabsTrigger>
          <TabsTrigger value='achievements'>Achievements</TabsTrigger>
          <TabsTrigger value='leaderboard'>Leaderboard</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <DailyChallengesGamified />
            <AchievementsPanelGamified />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <EnergySystemGamified />
            <BadgesCollectionGamified />
          </div>
        </TabsContent>
        <TabsContent value='challenges'>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <DailyChallengesGamified />
                    </div>
                    <div>
                      <EnergySystemGamified />
                    </div>
                  </div>
        </TabsContent>
        <TabsContent value='skills'>
          <SkillTreeGamified />
        </TabsContent>
        <TabsContent value='energy'>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <EnergySystemGamified />
                    <Card className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Energy Tips</h2>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h3 className="font-medium text-blue-800">Efficient Learning</h3>
                          <p className="text-blue-600">Plan your learning sessions when you have full energy for maximum efficiency.</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <h3 className="font-medium text-green-800">Energy Management</h3>
                          <p className="text-green-600">Energy restores automatically over time, or use premium items for instant restoration.</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <h3 className="font-medium text-purple-800">Bonus Activities</h3>
                          <p className="text-purple-600">Some special events may provide energy bonuses or reduced energy costs.</p>
                        </div>
                      </div>
                    </Card>
                  </div>
        </TabsContent>
        <TabsContent value='videos'>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <VideoUploaderGamified />
                    <Card className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Video Library</h2>
                      <p className="text-gray-600">Your uploaded videos will appear here.</p>
                    </Card>
                  </div>
        </TabsContent>
        <TabsContent value='campaigns'>
        <div className="grid grid-cols-1 gap-6">
                    <CampaignCreatorGamified />
                    <CampaignListGamified />
                  </div>
        </TabsContent>
        <TabsContent value='achievements'>
          <div className='grid lg:grid-cols-2 gap-6'>
            <AchievementsPanelGamified />
            <BadgesCollectionGamified />
          </div>
        </TabsContent>
        <TabsContent value='leaderboard'>
          <LeaderboardGamified />
        </TabsContent>
        <TabsContent value='settings'>
        <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Gamification Settings</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-2">Energy Settings</h3>
                          <p className="text-sm text-gray-600 mb-3">Configure energy restoration and consumption rates.</p>
                          <button className="text-sm bg-[#907527] text-white px-3 py-1 rounded">Configure</button>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-2">Challenge Difficulty</h3>
                          <p className="text-sm text-gray-600 mb-3">Adjust challenge targets and rewards.</p>
                          <button className="text-sm bg-[#907527] text-white px-3 py-1 rounded">Configure</button>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-2">Achievement Rewards</h3>
                          <p className="text-sm text-gray-600 mb-3">Customize point values and rarity levels.</p>
                          <button className="text-sm bg-[#907527] text-white px-3 py-1 rounded">Configure</button>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-2">Skill Tree</h3>
                          <p className="text-sm text-gray-600 mb-3">Manage skill nodes and prerequisites.</p>
                          <button className="text-sm bg-[#907527] text-white px-3 py-1 rounded">Configure</button>
                        </div>
                      </div>
                    </div>
                  </Card>
        </TabsContent>
      </Tabs>

    </div>
  );

  return (
    <GamificationProvider>
      <MainLayout>
        {pageContent}
      </MainLayout>
    </GamificationProvider>
  );
};

export default LMSCampaignsGamified;

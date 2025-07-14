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

  const mockCertificates = [
    { id: 'cert1', title: 'Password Security Basics', userName: 'Alex Johnson', completionDate: new Date('2025-04-15') },
    { id: 'cert2', title: 'Social Engineering Awareness', userName: 'Alex Johnson', completionDate: new Date('2025-03-28') },
    { id: 'cert3', title: 'Data Protection 101', userName: 'Alex Johnson', completionDate: new Date('2025-02-10') },
  ];

  const pageContent = (
    <div className='space-y-8 w-full'>
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
              <TabsContent value='overview'>
                <UserProgressDashboardGamified />
              </TabsContent>
              <TabsContent value='challenges'>
                <DailyChallengesGamified />
              </TabsContent>
              <TabsContent value='skills'>
                <SkillTreeGamified />
              </TabsContent>
              <TabsContent value='energy'>
                <EnergySystemGamified />
              </TabsContent>
              <TabsContent value='videos'>
                <div className='grid lg:grid-cols-2 gap-6'>
                  <VideoUploaderGamified />
                  <UserIntegrations />
                </div>
              </TabsContent>
              <TabsContent value='campaigns'>
                <div className='grid lg:grid-cols-2 gap-6'>
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
                <div className='grid gap-6'>
                  <h2 className='text-xl font-semibold flex gap-2 items-center'>
                    <Settings className='h-5 w-5' > Settings </Settings>
                  </h2>
                  {/* Settings content placeholder */}
                </div>
              </TabsContent>
            </Tabs>

            <section className='space-y-6'>
              <h2 className='text-xl font-semibold flex gap-2 items-center'>
                <Award className='h-5 w-5 text-yellow-500' /> Certificates
              </h2>
              <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {mockCertificates.map((cert) => (
                  <CertificateCardGamified key={cert.id} {...cert} />
                ))}
              </div>
      </section>
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

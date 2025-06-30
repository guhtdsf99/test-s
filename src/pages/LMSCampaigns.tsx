import { Link } from 'react-router-dom';
import { VideoLibrary } from '@/components/lms/VideoLibrary';
import { CampaignList } from '@/components/lms/CampaignList';
import React, { useState, useEffect } from 'react';
import { CampaignCreator } from '@/components/lms/CampaignCreator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Video, FileText, Users, Award } from 'lucide-react';
import CertificateCard from '@/components/lms/CertificateCard';
import MainLayout from '@/components/layout/MainLayout';
import { lmsService } from '@/services/api';

const LMSCampaigns = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    toast
  } = useToast();

  // Certificate type returned by the backend
  interface Certificate {
    id: string;
    title: string;
    userName: string;
    completionDate: Date;
  }

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);

  // Fetch certificates on component mount
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await lmsService.getCertificates();
        // Convert ISO dates to Date objects for the UI
        const parsed: Certificate[] = (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          userName: c.userName,
          completionDate: c.completionDate ? new Date(c.completionDate) : new Date()
        }));
        setCertificates(parsed);
      } catch (err) {
        console.error('Failed to load certificates', err);
        toast({
          title: 'Error',
          description: 'Failed to load certificates.',
          variant: 'destructive'
        });
      } finally {
        setLoadingCertificates(false);
      }
    };

    fetchCertificates();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Video className="h-6 w-6 text-[#907527]" />
              <h1 className="text-2xl font-bold text-indigo-400">LMS Management</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/employee-courses"></Link>
            <Link to="/profile-settings"></Link>
          </div>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-6 grid-cols-3">
            <TabsTrigger value="campaigns" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span>Videos</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Certificates</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <VideoLibrary />
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="grid grid-cols-1 gap-6">
              <CampaignCreator onCreate={() => setRefreshKey(k => k + 1)} />
              <CampaignList key={refreshKey} />
            </div>
          </TabsContent>

          <TabsContent value="certificates">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-gray-200 font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Your Certificates
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingCertificates ? (
                  <p>Loading certificates...</p>
                ) : certificates.length === 0 ? (
                  <p>No certificates found.</p>
                ) : (
                  certificates.map(cert => (
                    <CertificateCard
                      key={cert.id}
                      id={cert.id}
                      title={cert.title}
                      userName={cert.userName}
                      completionDate={cert.completionDate}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default LMSCampaigns;

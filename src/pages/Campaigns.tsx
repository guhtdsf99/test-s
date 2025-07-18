import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Calendar, FileText, Mail, Plus, Search, Users, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { phishingService, Campaign, aiReportService } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import MainLayout from '@/components/layout/MainLayout';
import CampaignDetails from '@/components/campaigns/CampaignDetails';
import CampaignForm from '@/components/campaigns/CampaignForm';
import CampaignList from '@/components/campaigns/CampaignList';
import { Badge } from '@/components/ui/badge';

// Mock data for campaign templates
const templates = [
  { id: 1, name: 'Password Reset', category: 'IT', difficulty: 'Medium' },
  { id: 2, name: 'Bonus Payment', category: 'HR', difficulty: 'Easy' },
  { id: 3, name: 'System Update', category: 'IT', difficulty: 'Hard' },
  { id: 4, name: 'Office Move', category: 'Admin', difficulty: 'Medium' },
];

// Helper function to transform campaign data to match the expected format
const transformCampaign = (campaign: any) => {
  // Ensure dates are in the correct format (YYYY-MM-DD)
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return {
    id: campaign.id,
    name: campaign.campaign_name || campaign.name || 'Unnamed Campaign',
    start_date: formatDate(campaign.start_date),
    end_date: formatDate(campaign.end_date),
    targets_count: campaign.targets_count || 0,
    clicks_count: campaign.clicks_count || 0,
    opens_count: campaign.opens_count || 0,
    click_rate: campaign.click_rate || 0,
    open_rate: campaign.open_rate || 0,
    status: campaign.status || 'Unknown', // Pass status from backend
  };
};

const EmailTemplates = lazy(() => import('./TemplateEditor'));
const LandingPageTemplates = lazy(() => import('./LandingPageTemplateEditor.tsx'));

// AI Report Button Component
const AIReportButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setReportStatus('Initiating report generation...');
      
      // Generate or get existing report
      const reportData = await aiReportService.generateReport();
      
      if (reportData.status === 'completed' && reportData.pdf_available) {
        // Report is already available, download it
        setReportStatus('Downloading existing report...');
        const blob = await aiReportService.downloadReport(reportData.report_id);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${reportData.report_name}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success',
          description: 'AI report downloaded successfully!',
        });
      } else if (reportData.status === 'generating') {
        // Report is being generated, poll for status
        setReportStatus('Generating AI report... This may take a few minutes.');
        pollReportStatus(reportData.report_id);
      } else {
        throw new Error('Unexpected report status');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate AI report',
        variant: 'destructive',
      });
      setIsGenerating(false);
      setReportStatus(null);
    }
  };

  const pollReportStatus = async (reportId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;
        const status = await aiReportService.getReportStatus(reportId);
        
        if (status.status === 'completed' && status.pdf_available) {
          setReportStatus('Report completed! Downloading...');
          
          // Download the completed report
          const blob = await aiReportService.downloadReport(reportId);
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${status.report_name}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast({
            title: 'Success',
            description: 'AI report generated and downloaded successfully!',
          });
          
          setIsGenerating(false);
          setReportStatus(null);
        } else if (status.status === 'failed') {
          throw new Error('Report generation failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Report generation timed out');
        } else {
          // Continue polling
          setReportStatus(`Generating AI report... (${Math.round((attempts / maxAttempts) * 100)}%)`);
          setTimeout(checkStatus, 5000);
        }
      } catch (error) {
        console.error('Error checking report status:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to check report status',
          variant: 'destructive',
        });
        setIsGenerating(false);
        setReportStatus(null);
      }
    };

    setTimeout(checkStatus, 5000);
  };

  return (
    <div className="text-center">
      <Button
        onClick={handleGenerateReport}
        disabled={isGenerating}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-5 w-5 mr-2" />
            Download a full AI report now
          </>
        )}
      </Button>
      {reportStatus && (
        <p className="mt-2 text-sm text-gray-600">{reportStatus}</p>
      )}
    </div>
  );
};

const Campaigns = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');

  // Function to fetch detailed campaign data
  const fetchCampaignDetails = async (campaignId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || 'https://adventurous-magic-production.up.railway.app';
      const response = await fetch(`${baseUrl}/api/email/campaigns/${campaignId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaign details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign details. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Handle campaign selection
  const handleSelectCampaign = async (campaign: any) => {
    try {
      setIsLoading(true);
      
      // Fetch detailed campaign analytics with authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || 'https://adventurous-magic-production.up.railway.app';
      const url = `${baseUrl}/api/email/campaigns/${campaign.id}/analytics/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch campaign analytics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the data to match what CampaignDetails expects
      const transformedCampaign = {
        id: campaign.id,
        name: campaign.campaign_name || campaign.name || 'Unnamed Campaign',
        template: campaign.template || 'Default Template',
        startDate: campaign.start_date || data.start_date || new Date().toISOString().split('T')[0],
        endDate: campaign.end_date || data.end_date || new Date().toISOString().split('T')[0],
        targets: data.metrics?.total_emails || campaign.targets_count || 0,
        clicks: data.metrics?.clicked || campaign.clicks_count || 0,
        opens: data.metrics?.opened || campaign.opens_count || 0,
        status: campaign.status, // Use status from the campaign list data
        analytics: {
          emailOpens: data.analytics?.emailOpens?.map((item: any) => ({
            id: item.id,
            email: item.email,
            name: item.name,
            department: item.department,
            opened: item.opened,
            clicked: item.clicked,
            sent_at: item.sent_at
          })) || []
        }
      };
      
      setSelectedCampaign(transformedCampaign);
    } catch (error) {
      console.error('Error handling campaign selection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load campaign details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch campaigns on component mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!companySlug) {
        setError('Company slug is required');
        return;
      }
      try {
        setIsLoading(true);
        const data = await phishingService.getCampaigns();        
        setCampaigns(data);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaigns. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load campaigns. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [toast, refreshKey, companySlug]);

  // Helper functions for date handling
  const startOfDay = (date: Date | string) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const endOfDay = (date: Date | string) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  // Filter campaigns by status
  const now = new Date();
  
  const filteredCampaigns = campaigns.map(transformCampaign).filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = filteredCampaigns.filter(
    (c) => c.status === 'Active' || c.status === 'Upcoming' || c.status === 'Pending'
  );
  const completedCampaigns = filteredCampaigns.filter((c) => c.status === 'Completed');

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-indigo-400">Phishing Campaigns</h1>
            <p className="text-indigo-400">Create and manage security awareness campaigns</p>
          </div>
          
            <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} modal={false}>
              <DialogTrigger asChild>
                <Button className="bg-[#907527] hover:bg-[#705b1e] mt-4 md:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <CampaignForm 
                  companySlug={companySlug || ''}
                  onClose={() => {}} 
                  onCreate={() => {
                    setRefreshKey(k=>k+1);
                    toast({
                      title: "Campaign Created",
                      description: "Your new campaign has been created successfully"
                    });
                  }} 
                />
              </DialogContent>
            </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">
              <Mail className="mr-2 h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="mr-2 h-4 w-4" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="landing_templates">
              <FileText className="mr-2 h-4 w-4" />
              Landing Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Campaigns</TabsTrigger>
                <TabsTrigger value="completed">Completed Campaigns</TabsTrigger>
              </TabsList>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <>
                  <TabsContent value="active" className="space-y-4 mt-6">
                    {activeCampaigns.length > 0 ? (
                      <CampaignList 
                        campaigns={activeCampaigns}
                        onSelectCampaign={handleSelectCampaign}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">No active campaigns found</div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="completed" className="space-y-4 mt-6">
                    {/* AI Report Download Button */}
                    <div className="flex justify-center mb-6">
                      <AIReportButton />
                    </div>
                    
                    {completedCampaigns.length > 0 ? (
                      <CampaignList 
                        campaigns={completedCampaigns}
                        onSelectCampaign={handleSelectCampaign}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">No completed campaigns found</div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </TabsContent>

          <TabsContent value="templates">
            <Suspense fallback={<div>Loading Email Templates...</div>}>
              <EmailTemplates />
            </Suspense>
          </TabsContent>

          <TabsContent value="landing_templates">
            <Suspense fallback={<div>Loading Landing Page Templates...</div>}>
              <LandingPageTemplates />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

        {/* Campaign Details Modal */}
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)} modal={false}>
          <DialogContent className="w-full sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Campaign Report : {selectedCampaign?.name}</DialogTitle>
            </DialogHeader>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#907527]"></div>
              </div>
            ) : selectedCampaign && (
              <div className="relative w-full overflow-auto">
                <CampaignDetails campaign={selectedCampaign} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom overlay to restore the background dimming effect */}
        {!!selectedCampaign && (
          <div 
            className="fixed inset-0 z-40 bg-black/80"
            onClick={() => setSelectedCampaign(null)}
          />
        )}
        {isCreateDialogOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/80"
            onClick={() => setCreateDialogOpen(false)}
          />
        )}
      </MainLayout>
  );
};

export default Campaigns;

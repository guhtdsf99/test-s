import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, ChartBarBig, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import axios from 'axios';
import API_ENDPOINTS, { getAuthHeaders } from '../../config/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CampaignStats {
  totalEnrolled: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  averageCompletion: string;
}

interface Campaign {
  id: number;
  title: string;
  course: string;
  audience: string;
  videoCount: number;
  startDate: string;
  endDate: string;
  stats: CampaignStats;
}

export const CampaignList = () => {
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  // Fetch campaigns from API
  React.useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        // Use the centralized API configuration
        const response = await axios.get(API_ENDPOINTS.CAMPAIGNS, {
          headers: getAuthHeaders()
        });
        
        // Ensure campaigns is always an array
        const campaignsArray = Array.isArray(response.data) ? response.data : [];
        
        setCampaigns(campaignsArray);
        setError(null);
      } catch (err) {
        setError('Failed to load campaigns. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load campaigns. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#907527]" />
          Training Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#907527]"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-gray-500">{error}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500">No campaigns found. Create your first campaign to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="space-y-1">
                  <h3 className="font-medium">{campaign.title}</h3>
                  <p className="text-sm text-gray-500">
                    Course: {campaign.course || 'Not specified'}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      {campaign.videoCount} videos
                    </span>
                    {campaign.startDate && campaign.endDate && (
                      <>
                        <span>|</span>
                        <span>{campaign.startDate} - {campaign.endDate}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedCampaign(campaign)} className="border-[#907527] text-[#907527] hover:bg-[#907527]/10">
                    <ChartBarBig className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)} modal={false}>
        <DialogContent className="w-full sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Campaign Report: {selectedCampaign?.title}</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Total Enrolled</p>
                  <p className="text-2xl font-bold">{selectedCampaign.stats.totalEnrolled}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{selectedCampaign.stats.completed}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-[#907527]">{selectedCampaign.stats.inProgress}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Not Started</p>
                  <p className="text-2xl font-bold text-gray-600">{selectedCampaign.stats.notStarted}</p>
                </Card>
              </div>

              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Start Date</TableCell>
                      <TableCell>{selectedCampaign.startDate}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>End Date</TableCell>
                      <TableCell>{selectedCampaign.endDate}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average Completion Rate</TableCell>
                      <TableCell>{selectedCampaign.stats.averageCompletion}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Target Audience</TableCell>
                      <TableCell>{selectedCampaign.audience}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom overlay to restore the background dimming effect without causing layout shifts */}
      {!!selectedCampaign && (
        <div 
          className="fixed inset-0 z-40 bg-black/80"
          onClick={() => setSelectedCampaign(null)}
        />
      )}
    </Card>
  );
};

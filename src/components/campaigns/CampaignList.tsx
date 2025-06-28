import React from 'react';
import { Button } from "@/components/ui/button";
import { BarChart, Calendar, Mail, Plus, Users, CheckCircle, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge'; 
import { format } from 'date-fns';

export interface Campaign {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  targets_count: number;
  clicks_count: number;
  opens_count: number;
  click_rate?: number;
  open_rate?: number;
}

interface CampaignListProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
}

// Helper functions for date handling
const startOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isValidDate = (dateString: string): boolean => {
  return !isNaN(Date.parse(dateString));
};

const formatDate = (dateString: string): string => {
  if (!isValidDate(dateString)) return 'Invalid date';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const getCampaignStatus = (startDate: string, endDate: string): string => {
  const now = new Date();
  
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return 'Invalid date';
  }
  
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  
  if (now < start) return 'Scheduled';
  if (now > end) return 'Completed';
  return 'Active';
};

const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onSelectCampaign }) => {
  if (campaigns.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <Mail className="h-12 w-12 text-gray-300" />
          <h3 className="text-xl font-medium mt-2">No campaigns found</h3>
          <p className="text-gray-500">Create a new campaign to start raising security awareness</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#907527] hover:bg-[#705b1e] mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create New Campaign
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-md border bg-white text-gray-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CAMPAIGN</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead>DATES</TableHead>
            <TableHead className="text-right">METRICS</TableHead>
            <TableHead className="text-right">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="font-medium">{campaign.name}</div>
                <div className="text-sm text-gray-500">
                  {campaign.targets_count} {campaign.targets_count === 1 ? 'recipient' : 'recipients'}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    getCampaignStatus(campaign.start_date, campaign.end_date) === 'Active' ? 'default' : 
                    getCampaignStatus(campaign.start_date, campaign.end_date) === 'Completed' ? 'secondary' : 'outline'
                  }
                  className={
                    getCampaignStatus(campaign.start_date, campaign.end_date) === 'Active' ? 'bg-green-100 text-green-800' :
                    getCampaignStatus(campaign.start_date, campaign.end_date) === 'Completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {getCampaignStatus(campaign.start_date, campaign.end_date)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                  <span>
                    {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-right">
                    <div className="font-medium">{campaign.opens_count || 0}</div>
                    <div className="text-xs text-gray-500">Opened</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{campaign.clicks_count || 0}</div>
                    <div className="text-xs text-gray-500">Clicked</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  onClick={() => onSelectCampaign(campaign)}
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  View Report
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CampaignList;

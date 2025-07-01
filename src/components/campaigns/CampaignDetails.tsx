
import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Mail, FileText, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface EmailAnalytic {
  email: string;
  name: string;
  department: string;
  opened: boolean;
  clicked: boolean;
}

interface Campaign {
  id: number;
  name: string;
  template: string;
  startDate: string;
  endDate: string;
  targets: number;
  clicks: number;
  opens: number;
  status: string;
  analytics: {
    emailOpens: EmailAnalytic[];
  };
}

interface CampaignDetailsProps {
  campaign: Campaign;
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({ campaign }) => {
  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Users className="h-4 w-4" />
            <span>Targets</span>
          </div>
          <p className="text-2xl font-bold">{campaign.targets}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Mail className="h-4 w-4" />
            <span>Clicks</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{campaign.clicks}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <FileText className="h-4 w-4" />
            <span>Email Opened</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{campaign.opens}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="h-4 w-4" />
            <span>Status</span>
          </div>
          <div className={`px-2 py-1 rounded text-sm inline-block ${
            campaign.status === 'Active' 
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {campaign.status}
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="summary">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4 mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Click Rate</TableCell>
                <TableCell>{Math.round((campaign.clicks / campaign.targets) * 100)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Email Reporting Rate</TableCell>
                <TableCell>{Math.round((campaign.opens / campaign.targets) * 100)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Start Date</TableCell>
                <TableCell>{campaign.startDate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>End Date</TableCell>
                <TableCell>{campaign.endDate}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="detailed" className="mt-4">
          <h3 className="text-lg font-medium mb-3">Employee Interactions</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Opened Email</TableHead>
                <TableHead>Clicked Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.analytics.emailOpens.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>
                    {item.opened ? (
                      <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Opened
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" /> Not Opened
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.clicked ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" /> Clicked
                      </Badge>
                    ) : (
                      <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Not Clicked
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignDetails;

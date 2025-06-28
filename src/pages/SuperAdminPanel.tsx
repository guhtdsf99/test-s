import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from '@/components/ui/toaster';
import { Building, Users, FileVideo, Mail, LayoutTemplate } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { CompanyManagement } from '@/components/super-admin/CompanyManagement';
import { SubscriptionManagement } from '@/components/super-admin/SubscriptionManagement';
import { VideoManagement } from '@/components/super-admin/VideoManagement';
import { EmailTemplateManagement } from '@/components/super-admin/EmailTemplateManagement';
import { SmtpManagement } from '@/components/super-admin/SmtpManagement';

const SuperAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('companies');

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Super Admin Control Panel</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="companies" className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              <span>Companies</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <FileVideo className="h-4 w-4" />
              <span>Videos</span>
            </TabsTrigger>
            <TabsTrigger value="smtp" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>SMTP Config</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1">
              <LayoutTemplate className="h-4 w-4" />
              <span>Email Templates</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="companies">
            <CompanyManagement />
          </TabsContent>
          
          <TabsContent value="subscriptions">
            <SubscriptionManagement />
          </TabsContent>
          
          <TabsContent value="videos">
            <VideoManagement />
          </TabsContent>
          
          <TabsContent value="smtp">
            <SmtpManagement />
          </TabsContent>
          
          <TabsContent value="templates">
            <EmailTemplateManagement />
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </MainLayout>
  );
};

export default SuperAdminPanel;

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAccessControl } from '@/components/admin/UserAccessControl';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserManualEntry } from '@/components/admin/UserManualEntry';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { FileText, Users, ShieldCheck } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-indigo-400">User Management</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Add Users</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Groups</span>
            </TabsTrigger>
            <TabsTrigger value="access" className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Access Control</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManualEntry />
          </TabsContent>
          
          <TabsContent value="departments">
            <DepartmentManagement />
          </TabsContent>
          
          <TabsContent value="access">
            <UserAccessControl />
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </MainLayout>
  );
};

export default UserManagement;

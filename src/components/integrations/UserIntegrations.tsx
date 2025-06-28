
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, UsersRound, Mail, Upload, Check, UserRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export const UserIntegrations = () => {
  const {
    toast
  } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [departments, setDepartments] = useState(['IT', 'HR', 'Finance', 'Marketing', 'Operations']);

  // Mock data for demonstration
  const mockUsers = [{
    id: 'u1',
    name: 'John Doe',
    email: 'john@example.com',
    department: 'IT'
  }, {
    id: 'u2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    department: 'HR'
  }, {
    id: 'u3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    department: 'Finance'
  }];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleFileUpload = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to upload",
        variant: "destructive"
      });
      return;
    }

    // Here you would handle the actual file upload to your backend
    toast({
      title: "File Upload Started",
      description: `Uploading ${file.name}. This may take a moment.`
    });

    // Simulate upload process
    setTimeout(() => {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${file.name} with user data.`
      });
      setFile(null);

      // Reset the file input
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }, 2000);
  };
  
  const handleConnectAD = () => {
    setConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      toast({
        title: "Integration Successful",
        description: "Successfully connected to Active Directory."
      });
      setConnecting(false);
    }, 2000);
  };
  
  const handleConnectO365 = () => {
    setConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      toast({
        title: "Integration Successful",
        description: "Successfully connected to Microsoft 365."
      });
      setConnecting(false);
    }, 2000);
  };
  
  const handleAddDepartment = () => {
    const newDept = document.getElementById('new-department') as HTMLInputElement;
    if (newDept && newDept.value) {
      if (!departments.includes(newDept.value)) {
        setDepartments([...departments, newDept.value]);
        toast({
          title: "Department Added",
          description: `Added ${newDept.value} to departments list.`
        });
        newDept.value = '';
      } else {
        toast({
          title: "Department Exists",
          description: "This department already exists in the list.",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Integration Options</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="excel">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="excel">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel Import
            </TabsTrigger>
            <TabsTrigger value="activedir">
              <UsersRound className="mr-2 h-4 w-4" />
              Active Directory
            </TabsTrigger>
            <TabsTrigger value="o365">
              <Mail className="mr-2 h-4 w-4" />
              Microsoft 365
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="excel-upload">Upload User Data (Excel File)</Label>
                <Input 
                  id="excel-upload" 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileChange}
                />
                <p className="text-sm text-gray-500">
                  Excel file should contain columns: Name, Email, Department
                </p>
              </div>
              
              <Button onClick={handleFileUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Department Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-department" className="mb-2">Add Department</Label>
                  <div className="flex space-x-2">
                    <Input id="new-department" placeholder="New department name" />
                    <Button onClick={handleAddDepartment}>Add</Button>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2">Select Group</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activedir">
            <div className="space-y-6">
              <div className="p-6 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <UserRound className="mr-2 h-5 w-5" />
                  Active Directory Integration
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect to your organization's Active Directory to import and manage users. 
                  This will sync user accounts and keep them updated automatically.
                </p>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad-server">AD Server</Label>
                      <Input id="ad-server" placeholder="ldap://ad.example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad-domain">Domain</Label>
                      <Input id="ad-domain" placeholder="example.com" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad-username">Username</Label>
                      <Input id="ad-username" placeholder="administrator" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad-password">Password</Label>
                      <Input id="ad-password" type="password" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sync-schedule" />
                    <Label htmlFor="sync-schedule" className="text-sm font-normal">
                      Enable daily synchronization
                    </Label>
                  </div>
                  
                  <Button onClick={handleConnectAD} disabled={connecting}>
                    {connecting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Connect to AD
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="o365">
            <div className="space-y-6">
              <div className="p-6 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <Mail className="mr-2 h-5 w-5" />
                  Microsoft 365 Integration
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect to Microsoft 365 to import user accounts from your organization. 
                  This will sync user profiles and allow for automated user provisioning.
                </p>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="o365-tenant">Tenant ID</Label>
                      <Input id="o365-tenant" placeholder="your-tenant.onmicrosoft.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="o365-client">Client ID</Label>
                      <Input id="o365-client" placeholder="Application (client) ID" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="o365-secret">Client Secret</Label>
                    <Input id="o365-secret" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="mb-1">Sync Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="sync-users" />
                        <Label htmlFor="sync-users" className="text-sm font-normal">
                          Sync user accounts
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="sync-groups" />
                        <Label htmlFor="sync-groups" className="text-sm font-normal">
                          Sync user groups
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="auto-create" />
                        <Label htmlFor="auto-create" className="text-sm font-normal">
                          Auto-create users on first login
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={handleConnectO365} disabled={connecting}>
                    {connecting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Connect to Microsoft 365
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

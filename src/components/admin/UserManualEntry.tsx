import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, UserPlus, Upload, Check, UserRound, RefreshCw, Loader2, Search, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { userService, companyInfoService } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Use the User, Department, and CompanyInfo interfaces from the API service
import { User, Department, CompanyInfo } from '@/services/api';

export const UserManualEntry = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(''); // single pick for now
  const [role, setRole] = useState('USER');

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(true);

  // Fetch users, departments, and company info on component mount
  useEffect(() => {
    fetchData();
    fetchCompanyInfo();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, departmentsData] = await Promise.all([
        userService.getUsers(),
        userService.getDepartments()
      ]);
      setUsers(usersData);
      setDepartments(departmentsData);
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: "There was an error loading users and Groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      setLoadingCompanyInfo(true);
      const info = await companyInfoService.getCompanyInfo();
      setCompanyInfo(info);
    } catch (error) {
      console.error('Failed to load company info:', error);
      // Don't show a toast for this error as it's not critical
    } finally {
      setLoadingCompanyInfo(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to upload",
        variant: "destructive",
      });
      return;
    }


    toast({
      title: "File upload started",
      description: `Uploading ${file.name}. This may take a moment.`,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await userService.uploadUsersBulk(formData);

      // Check if response has the expected format
      if (response && response.created_users && Array.isArray(response.created_users)) {
        setUsers([...users, ...response.created_users]);

        // Show any errors in the toast if there are any
        if (response.errors && response.errors.length > 0) {
          toast({
            title: `Upload partially successful (${response.total_created} users added)`,
            description: `There were ${response.total_errors} errors: ${response.errors.slice(0, 3).join(', ')}${response.errors.length > 3 ? '...' : ''}`,
            variant: "destructive", // Using destructive instead of warning as it's a supported variant
          });
          return;
        }
      } else {
        console.error('Unexpected response format:', response);
        // If the response is an array, use it directly (backward compatibility)
        if (Array.isArray(response)) {
          setUsers([...users, ...response]);
        } else {
          throw new Error('Invalid response format from server');
        }
      }

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and users added successfully.`,
      });

      setFile(null);
      // Reset the file input
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('File upload error:', error);

      // Extract the error message
      const errorMessage = error instanceof Error ? error.message : "There was an error uploading the file.";

      // Check if the error is about the company user limit
      const isUserLimitError = errorMessage.toLowerCase().includes('limit') &&
        errorMessage.toLowerCase().includes('user');

      toast({
        title: isUserLimitError ? "Company User Limit Reached" : "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async () => {
    if (!firstName || !lastName || !email || !department || !role) {
      toast({
        title: "Incomplete information",
        description: "Please enter all required information",
        variant: "destructive",
      });
      return;
    }

    try {
      const newUser = await userService.addUser({
        first_name: firstName,
        last_name: lastName,
        email,
        departments: [department], // backend expects array
        role
      });

      setUsers([...users, newUser]);

      toast({
        title: "User added",
        description: "User has been added successfully",
      });

      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setDepartment('');
      setRole('USER');
    } catch (error) {
      console.error('Add user error:', error);

      // Extract the error message
      const errorMessage = error instanceof Error ? error.message : "There was an error adding the user.";

      // Check if the error is about the company user limit
      const isUserLimitError = errorMessage.toLowerCase().includes('limit') &&
        errorMessage.toLowerCase().includes('user');

      toast({
        title: isUserLimitError ? "Company User Limit Reached" : "Failed to add user",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department_names?.join(', ').toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-[#907527]" />
          Add Users
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      {/* User Limit Indicator */}
      {companyInfo && companyInfo.current_user_count !== undefined && (
        <div className="px-6 pb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">
              User Limit: {companyInfo.current_user_count} / {companyInfo.number_of_allowed_users}
            </span>
            <span className="text-sm text-gray-500">
              {companyInfo.number_of_allowed_users - companyInfo.current_user_count} remaining
            </span>
          </div>
          <Progress
            value={(companyInfo.current_user_count / companyInfo.number_of_allowed_users) * 100}
            className="h-2"
          />

          {/* Warning when approaching limit */}
          {companyInfo.current_user_count >= companyInfo.number_of_allowed_users * 0.9 && companyInfo.current_user_count < companyInfo.number_of_allowed_users && (
            <Alert variant="warning" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>User limit almost reached</AlertTitle>
              <AlertDescription>
                Your company is approaching its user limit. Please contact support to increase your limit.
              </AlertDescription>
            </Alert>
          )}

          {/* Error when limit reached */}
          {companyInfo.current_user_count >= companyInfo.number_of_allowed_users && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>User limit reached</AlertTitle>
              <AlertDescription>
                Your company has reached its user limit. You cannot add more users until you upgrade your plan or contact support.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Manual Entry</span>
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-1">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import from Excel</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 py-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Group</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default" disabled>
                        No Groups available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleAddUser}
              className="bg-[#907527] hover:bg-[#705b1e]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </TabsContent>

          <TabsContent value="excel" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="excel-upload">Upload Excel File with Users</Label>
              <div className="grid gap-2">
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
                <div className="text-xs text-gray-500">
                  Accepted formats: .xlsx, .xls, .csv
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {file && (
                <div className="text-sm">
                  Selected: {file.name}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Required Columns</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Email Address</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Name</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Group</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={handleFileUpload}
              disabled={!file}
              className="bg-[#907527] hover:bg-[#705b1e]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Users
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">User List</h3>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found in this company.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.department_names?.join(', ') || '-'}
                      </TableCell>
                      <TableCell className="capitalize">{user.role?.toLowerCase()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

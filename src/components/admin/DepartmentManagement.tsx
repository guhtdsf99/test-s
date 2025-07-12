import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Users, 
  RefreshCw,
  Loader2,
  UserCog,
  Save
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { userService, Department, User } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const DepartmentManagement = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('departments');
  const [userDepartmentChanges, setUserDepartmentChanges] = useState<{[key: string]: string[]}>({});

  // Fetch departments and users on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [departmentsData, usersData] = await Promise.all([
        userService.getDepartments(),
        userService.getUsers()
      ]);
      setDepartments(departmentsData);
      setUsers(usersData);
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: "There was an error loading departments and users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      toast({
        title: "Department name required",
        description: "Please enter a department name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newDept = await userService.addDepartment(newDepartment);
      setDepartments([...departments, newDept]);
      setNewDepartment('');
      toast({
        title: "Department added",
        description: "Department has been added successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to add department",
        description: "There was an error adding the department. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await userService.deleteDepartment(id);
      setDepartments(departments.filter(dept => dept.id !== id));
      toast({
        title: "Department deleted",
        description: "Department has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to delete department",
        description: "There was an error deleting the department. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add a department to a user (only if not already present)
  const handleAddDepartmentToUser = (userId: string, departmentId: string) => {
    setUserDepartmentChanges(prev => {
      const current: string[] = prev[userId] ?? (users.find(u => u.id === userId)?.departments ?? []);
      if (current.includes(departmentId)) return prev;
      return { ...prev, [userId]: [...current, departmentId] };
    });
  };

  // Remove a department from a user
  const handleRemoveDepartmentFromUser = (userId: string, departmentId: string) => {
    setUserDepartmentChanges(prev => {
      const current: string[] = prev[userId] ?? (users.find(u => u.id === userId)?.departments ?? []);
      return { ...prev, [userId]: current.filter((id: string) => id !== departmentId) };
    });
  };

  // Save department changes for users
  const saveUserDepartmentChanges = async () => {
    try {
      const promises = Object.entries(userDepartmentChanges).map(([userId, deptArray]) => 
        userService.updateUserDepartments(userId, deptArray as string[])
      );
      
      await Promise.all(promises);
      
      // Update local users state
      const updatedUsers: User[] = users.map(user => {
        if (userDepartmentChanges[user.id]) {
          const newDeptIds = userDepartmentChanges[user.id] as string[];
          const newDeptNames = departments.filter(d => newDeptIds.includes(d.id)).map(d => d.name);
          return {
            ...user,
            departments: newDeptIds,
            department_names: newDeptNames
          } as User;
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setUserDepartmentChanges({});
      
      // Refresh departments to update user counts
      const updatedDepartments = await userService.getDepartments();
      setDepartments(updatedDepartments);
      
      toast({
        title: "Changes saved",
        description: "User department assignments have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to save changes",
        description: "There was an error updating user departments. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.first_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (user.department_names && user.department_names.join(', ').toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#907527]" />
          Group Management
        </CardTitle>
        <div className="flex gap-2">
          {selectedTab === 'users' && Object.keys(userDepartmentChanges).length > 0 && (
            <Button 
              size="sm" 
              onClick={saveUserDepartmentChanges}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
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
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="departments" onValueChange={setSelectedTab} value={selectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              User Assignments
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="departments" className="space-y-6">
          {/* Add Department Form */}
          <div className="flex items-end gap-2">
            <div className="space-y-2 flex-1">
              <Label htmlFor="department-name">Add New Group</Label>
              <Input
                id="department-name"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <Button 
              onClick={handleAddDepartment}
              className="bg-[#907527] hover:bg-[#705b1e]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search Groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Departments Table */}
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No groups found matching your search.' : 'No groups found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{dept.user_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={dept.user_count > 0}
                          title={dept.user_count > 0 ? "Cannot delete Group with users" : "Delete Group"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            {/* Search Users */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {/* Users Table */}
            {loading ? (
              <div className="space-y-4">
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
                    <TableHead>Add</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {userSearchTerm ? 'No users found matching your search.' : 'No users found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="space-x-1">
                          {(userDepartmentChanges[user.id] ?? user.departments ?? []).map(depId => {
                              const dep = departments.find(d => d.id === depId);
                              return (
                                <Button key={depId} size="sm" variant="outline" className="px-2 py-0.5 text-xs bg-white text-gray-800 border-gray-300 hover:bg-gray-50" onClick={() => handleRemoveDepartmentFromUser(user.id, depId)}>
                                  {dep?.name || 'Unnamed'} ×
                                </Button>
                              );
                          })}
                        </TableCell>
                        <TableCell>
                          <Select onValueChange={(val)=>handleAddDepartmentToUser(user.id,val)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Add Group" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.filter(d => !(userDepartmentChanges[user.id] ?? user.departments ?? []).includes(d.id as string)).map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="capitalize">{user.role?.toLowerCase()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

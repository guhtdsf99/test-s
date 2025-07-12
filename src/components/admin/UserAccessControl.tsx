import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Search, Check, X, RefreshCw } from 'lucide-react';
import { userService, User as UserType } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config';

// We're using the User type from the API service now

export const UserAccessControl: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle refreshing the user list
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Handle changing user status (active/inactive)
  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      // Don't allow deactivating yourself
      if (userId === currentUser?.id && !isActive) {
        toast({
          title: 'Action not allowed',
          description: 'You cannot deactivate your own account.',
          variant: 'destructive',
        });
        return;
      }

      // Update user status in the API
      const updatedUser = await userService.updateUserStatus(userId, isActive);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? {...user, is_active: isActive} : user
      ));

      // Show success message
      const statusText = isActive ? 'activated' : 'deactivated';
      const userName = `${updatedUser.first_name} ${updatedUser.last_name}`;
      
      toast({
        title: `User ${statusText}`,
        description: `${userName} has been ${statusText} successfully.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to reset the password for ${userName}? A new temporary password will be sent to their email.`)) {
      return;
    }
  
    try {
      // Get company slug from the URL path
      const pathParts = window.location.pathname.split('/');
      const companySlug = pathParts.find(part => 
        part && !['api', 'auth', 'users', 'reset-password', 'admin'].includes(part)
      ) || 'default-company';
  
      const response = await fetch(
        `${API_BASE_URL}/auth/users/${companySlug}/reset-password/`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            user_id: userId
          })
        }
      );
  
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Backend error:', responseData);
        throw new Error(
          responseData.detail || 
          responseData.message || 
          `Failed to reset password (${response.status} ${response.statusText})`
        );
      }
      
      toast({
        title: 'Password Reset',
        description: responseData.detail || `A new temporary password has been sent to ${userName}'s email.`,
      });
      
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    }
  };
  // Filter users based on search term
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department_names?.join(', ').toLowerCase() || '').includes(searchTerm.toLowerCase()))
      )
    : users;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#907527]" />
          User Access Control
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
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search for user..."
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
                  <TableHead>Role</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Reset</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found in this company.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role?.toLowerCase()}</TableCell>
                      <TableCell>{user.department_names?.join(', ') || '-'}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Don't allow changing super_admin status */}
                        {user.role?.toLowerCase() === 'super_admin' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-gray-50 text-gray-500 border-gray-200"
                            disabled
                          >
                            Cannot Modify
                          </Button>
                        ) : user.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            onClick={() => handleStatusChange(user.id, false)}
                            disabled={user.id === currentUser?.id}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            onClick={() => handleStatusChange(user.id, true)}
                          >
                            Activate
                          </Button>
                        )}
                        </TableCell>
                        <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          onClick={() => handleResetPassword(user.id, `${user.first_name} ${user.last_name}`)}
                        >
                          Reset Password
                        </Button>
                        </TableCell>
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

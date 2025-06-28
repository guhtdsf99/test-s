import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Mail, Key, User, Shield, LogOut, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MainLayout from '@/components/layout/MainLayout';
import { authService, User as UserType } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// We'll use the User type from the API service

const ProfileSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await authService.getProfile();
        setUser(userData);
        
        // Initialize form data with user data
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [toast]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleProfileUpdate = async () => {
    try {
      setIsSubmitting(true);
      
      // Update profile with API
      const updatedUser = await authService.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      });
      
      // Update local state
      setUser(updatedUser);
      
      // Refresh user in auth context
      await refreshUser();
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordChange = async () => {
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Your new password and confirmation password do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Change password with API
      await authService.changePassword(formData.currentPassword, formData.newPassword);
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully. You will be logged out.",
      });
      
      // Get company slug for redirection
      const companySlug = localStorage.getItem('companySlug');
      
      // Short delay to show the success message before logout
      setTimeout(() => {
        // Log the user out
        authService.logout();
        
        // Redirect to login page
        if (companySlug) {
          window.location.href = `/${companySlug}/login`;
        } else {
          window.location.href = '/';
        }
      }, 1500);
      
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "Failed to update your password. Please check your current password and try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    
    // Get company slug for redirection
    const companySlug = localStorage.getItem('companySlug');
    if (companySlug) {
      navigate(`/${companySlug}/login`);
    } else {
      navigate('/');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex items-center gap-4 mb-6 animate-pulse">
            <div className="h-14 w-14 rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-[#907527]">
                {user.first_name && user.last_name 
                  ? `${user.first_name[0]}${user.last_name[0]}` 
                  : user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-200">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user.username}
              </h1>
              <div className="flex items-center gap-2 text-gray-400">
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        ) : null}
        
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account's profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-1">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <Button onClick={handleProfileUpdate} disabled={isSubmitting} className="flex items-center gap-1">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50 text-blue-800 border-blue-100">
                    <AlertDescription>
                      Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handlePasswordChange} disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Change Password'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ProfileSettings;

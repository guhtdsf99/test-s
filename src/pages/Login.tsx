import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { companySlug } = useParams<{ companySlug?: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // If accessing the login page directly without a company slug
    if (!companySlug && location.pathname === '/login') {
      // Redirect to company selection page
      navigate('/');
    }
  }, [companySlug, navigate, location]);
  
  // Redirect logged-in users to the appropriate page based on their role
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      // Get a valid company slug - either from URL params or from localStorage
      const validCompanySlug = companySlug || localStorage.getItem('companySlug');
      
      if (validCompanySlug) {
        // Get user role and convert to lowercase for case-insensitive comparison
        const userRole = user.role?.toLowerCase() || '';
        
        // Define admin roles
        const adminRoles = ['admin', 'super_admin', 'company_admin'];
        
        // Redirect based on role
        if (userRole === 'user') {
          // Regular users go to employee-courses
          navigate(`/${validCompanySlug}/employee-courses`, { replace: true });
        } else if (adminRoles.some(role => userRole === role || userRole.includes(role))) {
          // Admins go to dashboard
          navigate(`/${validCompanySlug}/dashboard`, { replace: true });
        } else {
          // Default fallback
          navigate(`/${validCompanySlug}/dashboard`, { replace: true });
        }
      } else {
        // If no valid company slug, redirect to company selection
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, authLoading, companySlug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Import the authService dynamically to avoid circular dependencies
      const { authService } = await import('@/services/api');
      
      // Call the Django backend login API
      const response = await authService.login(email, password);
      
      // Store the company slug in localStorage if it exists in the URL
      if (companySlug) {
        localStorage.setItem('companySlug', companySlug);
      }
      
      // Get user role from the response
      const userRole = response.user?.role?.toLowerCase() || '';
      
      // Get the valid company slug - either from URL params or from localStorage
      const validCompanySlug = companySlug || localStorage.getItem('companySlug');
      
      // Determine the redirect path based on user role and company context
      let redirectPath;
      
      if (validCompanySlug) {
        // For regular users, redirect to employee-courses page
        if (userRole === 'user') {
          redirectPath = `/${validCompanySlug}/employee-courses`;
          
          toast({
            title: "Login successful",
            description: "Welcome to your courses portal",
          });
        } else {
          // For admins and other roles, redirect to dashboard
          redirectPath = `/${validCompanySlug}/dashboard`;
          
          toast({
            title: "Login successful",
            description: "Welcome to the dashboard",
          });
        }
      } else {
        // If no valid company slug found, redirect to company selection
        redirectPath = '/';
        
        toast({
          title: "Login successful",
          description: "Please select a company",
        });
      }
      
      // Redirect to the appropriate page
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Email or password is incorrect",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/876a553e-d478-4016-a8f0-1580f492ca19.png" 
            alt="CSWORD Logo" 
            className="h-12 mx-auto mb-4" 
          />
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-gray-500 mt-2">Log in to access the control panel</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your login credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email" 
                    className="pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link to={`/${companySlug}/reset-password`} className="text-xs text-[#907527] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#907527] hover:bg-[#705b1e]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Login
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

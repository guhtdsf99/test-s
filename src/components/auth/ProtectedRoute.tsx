import { Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectTo?: string;
  // If true, will use company-specific login page
  useCompanyRedirect?: boolean;
  // If true, will restrict users with 'user' role to only training and profile pages
  restrictUserRole?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = [],
  redirectTo = '/login',
  useCompanyRedirect = true,
  restrictUserRole = true
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { companySlug } = useParams<{ companySlug?: string }>();
  const location = useLocation();

  // Determine the redirect path based on company context
  const getRedirectPath = () => {
    // Get a valid company slug - either from URL or from localStorage
    const validCompanySlug = companySlug || localStorage.getItem('companySlug') || '';
    
    if (useCompanyRedirect && validCompanySlug) {
      return `/${validCompanySlug}/login`;
    }
    return redirectTo;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={getRedirectPath()} replace />;
  }

  // Convert user role to lowercase for case-insensitive comparison
  const userRoleLower = user.role?.toLowerCase() || '';
  
  // Convert allowed roles to lowercase for comparison
  const allowedRolesLower = allowedRoles.map(role => role.toLowerCase());
  
  if (allowedRoles.length > 0 && !allowedRolesLower.includes(userRoleLower)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // If user role is 'user' and we're restricting access, only allow access to training and profile
  // Company Admin, Admin, and Super Admin have access to all routes
  const adminRoles = ['admin', 'super_admin', 'company_admin'];
  if (restrictUserRole && user.role?.toLowerCase() === 'user' && !adminRoles.includes(user.role?.toLowerCase())) {
    const currentPath = location.pathname.toLowerCase();
    
    // Allow access only to employee-courses and profile pages
    const allowedPaths = [
      '/employee-courses',
      '/profile-settings'
      // lms-campaigns is now restricted to admin users only
    ];
    
    // Check if the current path contains any of the allowed paths
    const isAllowedPath = allowedPaths.some(path => currentPath.includes(path));
    
    if (!isAllowedPath) {
      // Get a valid company slug - either from URL or from localStorage
      const validCompanySlug = companySlug || localStorage.getItem('companySlug');
      
      if (validCompanySlug) {
        // Redirect to employee-courses page if trying to access restricted path
        return <Navigate to={`/${validCompanySlug}/employee-courses`} replace />;
      } else {
        // If no valid company slug, redirect to company selection
        return <Navigate to="/" replace />;
      }
    }
  }

  return <Outlet />;
};

export const withAuth = (Component: React.ComponentType, allowedRoles: string[] = []) => {
  return function WithAuth(props: any) {
    const { user, isAuthenticated, loading } = useAuth();
    const { companySlug } = useParams<{ companySlug?: string }>();

    // Determine the redirect path based on company context
    const getRedirectPath = () => {
      if (companySlug) {
        return `/${companySlug}/login`;
      }
      return '/';
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return <Navigate to={getRedirectPath()} replace />;
    }

    // Convert user role to lowercase for case-insensitive comparison
    const userRoleLower = user.role?.toLowerCase() || '';
    
    // Convert allowed roles to lowercase for comparison
    const allowedRolesLower = allowedRoles.map(role => role.toLowerCase());
    
    if (allowedRoles.length > 0 && !allowedRolesLower.includes(userRoleLower)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <Component {...props} />;
  };
};

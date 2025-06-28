import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Component that redirects users to different pages based on their role
 * - Regular users (role='user') are redirected to the employee-courses page
 * - All other users are redirected to the dashboard
 */
const UserRoleRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const { companySlug } = useParams<{ companySlug?: string }>();
  const { toast } = useToast();
  
  // Get a valid company slug - either from URL or from localStorage
  const getValidCompanySlug = (): string => {
    if (companySlug) {
      return companySlug;
    }
    
    // If no company slug in URL, try to get from localStorage
    const storedCompanySlug = localStorage.getItem('companySlug');
    if (storedCompanySlug) {
      return storedCompanySlug;
    }
    
    // If no company slug found, return a default (will be handled by redirect)
    return '';
  };
  
  const validCompanySlug = getValidCompanySlug();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Get the user's role and convert to lowercase for case-insensitive comparison
  const userRole = user?.role?.toLowerCase() || '';
  
  // Define admin roles that should be redirected to dashboard
  const adminRoles = ['admin', 'super_admin', 'company_admin'];
  
  // If the user is a regular user, redirect to employee-courses
  if (userRole === 'user') {
    return <Navigate to={`/${validCompanySlug}/employee-courses`} replace />;
  }
  
  // For admin roles, redirect to dashboard
  // This includes company_admin which should have full access
  if (adminRoles.some(role => userRole === role || userRole.includes(role))) {
    return <Navigate to={`/${validCompanySlug}/dashboard`} replace />;
  }
  
  // For any other roles, default to dashboard
  return <Navigate to={`/${validCompanySlug}/dashboard`} replace />;
};

export default UserRoleRedirect;

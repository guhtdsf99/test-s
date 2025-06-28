import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { companyService } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * A component that validates if a company exists before rendering its routes
 */
export const CompanyRoute = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCompany, setIsValidCompany] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Check if user is a Super Admin
  const isSuperAdmin = () => {
    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase() || '';
      return userRole === 'super_admin' || userRole === 'superadmin';
    }
    return false;
  };
  
  useEffect(() => {
    const validateCompany = async () => {
      // If user is a Super Admin, skip company validation
      if (isSuperAdmin()) {
        // Super Admins can access any company
        setIsValidCompany(true);
        setIsValidating(false);
        
        // Store the company slug for API calls
        if (companySlug) {
          localStorage.setItem('companySlug', companySlug);
        }
        return;
      }
      
      // If no company slug in URL, check if we have one in localStorage
      if (!companySlug) {
        const storedCompanySlug = localStorage.getItem('companySlug');
        if (storedCompanySlug) {
          // We have a stored company slug, consider it valid
          setIsValidCompany(true);
        }
        setIsValidating(false);
        return;
      }

      // Skip validation for special routes
      if (companySlug === 'unauthorized' ) {
        setIsValidCompany(true);
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        const companies = await companyService.getCompanies();
        const companyExists = companies.some(company => company.slug === companySlug);
        
        setIsValidCompany(companyExists);
        
        if (!companyExists) {
          // Don't clear the stored company slug if it's different from the invalid one
          const storedCompanySlug = localStorage.getItem('companySlug');
          if (storedCompanySlug === companySlug) {
            localStorage.removeItem('companySlug');
          }
          
          // Only show toast if not a system route
          if (companySlug !== 'login' && companySlug !== 'dashboard') {
            toast({
              title: "Company Not Found",
              description: `The company "${companySlug}" does not exist.`,
              variant: "destructive",
            });
          }
        } else {
          // Store valid company slug
          localStorage.setItem('companySlug', companySlug);
        }
      } catch (error) {
        console.error('Error validating company:', error);
        setIsValidCompany(false);
        
        toast({
          title: "Error",
          description: "Failed to validate company. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateCompany();
  }, [companySlug, toast]);

  if (isValidating) {
    // Show loading state while validating
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

  // If company is invalid
  if (!isValidCompany) {
    // If user is authenticated, redirect based on role
    if (isAuthenticated && user) {
      // Get the valid company slug from localStorage (if it exists)
      const storedCompanySlug = localStorage.getItem('companySlug');
      
      if (storedCompanySlug) {
        // If user is a regular user, redirect to employee-courses page
        if (user.role?.toLowerCase() === 'user') {
          return <Navigate to={`/${storedCompanySlug}/employee-courses`} replace />;
        } else {
          // For admins and other roles, redirect to dashboard
          return <Navigate to={`/${storedCompanySlug}/dashboard`} replace />;
        }
      }
    }
    
    // If not authenticated or no stored company, redirect to company selection
    return <Navigate to="/" replace />;
  }

  // If company is valid, render the child routes
  return <Outlet />;
};

export default CompanyRoute;

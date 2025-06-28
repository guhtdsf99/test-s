import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  
  // Get the stored company slug if available
  const companySlug = localStorage.getItem('companySlug');
  
  const handleGoBack = () => {
    // Redirect to employee-courses page if company slug is available
    if (companySlug) {
      navigate(`/${companySlug}/employee-courses`);
    } else {
      // Fallback to if no company slug is found
      navigate('/');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <ShieldAlert className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this resource. Please return to an authorized area.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

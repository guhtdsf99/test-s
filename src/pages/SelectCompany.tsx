import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, Building, AlertCircle } from 'lucide-react';
import { companyService, Company } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';

// Company interface is now imported from services/api

const SelectCompany = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch companies from the backend API
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const data = await companyService.getCompanies();
        setCompanies(data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load companies');
        setLoading(false);
        console.error('Error fetching companies:', error);
        
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.description && company.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectCompany = (companySlug: string) => {
    navigate(`/${companySlug}/login`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/876a553e-d478-4016-a8f0-1580f492ca19.png" 
            alt="CSWORD Logo" 
            className="h-12 mx-auto mb-4" 
          />
          <h1 className="text-3xl font-bold">Select Your Company</h1>
          <p className="text-gray-500 mt-2">Choose your company to continue to the login page</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Available Companies</CardTitle>
            <CardDescription>Select the company you belong to</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No companies found</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredCompanies.map(company => (
                  <Card key={company.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSelectCompany(company.slug)}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-gray-100 p-3 rounded-full flex-shrink-0">
                          <Building className="h-6 w-6 text-[#907527]" />
                        </div>
                        <div className="min-w-0"> {/* Prevent text overflow */}
                          <h3 className="font-medium text-lg truncate">{company.name}</h3>
                          {company.description && (
                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{company.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-gray-500">
              If your company is not listed, please contact your administrator
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SelectCompany;

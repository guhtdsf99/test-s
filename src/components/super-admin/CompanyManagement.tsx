
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Building, Plus, Edit, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  name: string;
  adminName: string;
  adminEmail: string;
  subdomain: string;
  userLimit: number;
  campaignLimit: number;
  lmsCampaignLimit: number;
  active: boolean;
}

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  subdomain: z.string().min(1, "Subdomain is required"),
  userLimit: z.coerce.number().min(1, "User limit must be at least 1"),
  campaignLimit: z.coerce.number().min(1, "Campaign limit must be at least 1"),
  lmsCampaignLimit: z.coerce.number().min(1, "LMS campaign limit must be at least 1"),
});

export const CompanyManagement = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: '1',
      name: 'Acme Corp',
      adminName: 'John Smith',
      adminEmail: 'john@acmecorp.com',
      subdomain: 'acmecorp',
      userLimit: 50,
      campaignLimit: 10,
      lmsCampaignLimit: 5,
      active: true
    },
    {
      id: '2',
      name: 'TechSolutions Inc.',
      adminName: 'Sara Lee',
      adminEmail: 'sara@techsolutions.com',
      subdomain: 'techsolutions',
      userLimit: 100,
      campaignLimit: 20,
      lmsCampaignLimit: 10,
      active: true
    },
    {
      id: '3',
      name: 'Global Enterprises',
      adminName: 'Mike Johnson',
      adminEmail: 'mike@globalent.com',
      subdomain: 'globalent',
      userLimit: 200,
      campaignLimit: 30,
      lmsCampaignLimit: 15,
      active: false
    }
  ]);
  
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      subdomain: '',
      userLimit: 50,
      campaignLimit: 10,
      lmsCampaignLimit: 5,
    }
  });

  const handleAddCompany = (data: any) => {
    const newCompany: Company = {
      id: Date.now().toString(),
      name: data.name,
      adminName: data.adminName,
      adminEmail: data.adminEmail,
      subdomain: data.subdomain,
      userLimit: data.userLimit,
      campaignLimit: data.campaignLimit,
      lmsCampaignLimit: data.lmsCampaignLimit,
      active: true
    };

    setCompanies([...companies, newCompany]);
    
    toast({
      title: "Company added",
      description: `${data.name} has been added successfully. Login credentials have been sent to ${data.adminEmail}.`,
    });

    form.reset();
    setIsDialogOpen(false);
  };

  const toggleCompanyStatus = (id: string) => {
    setCompanies(companies.map(company => 
      company.id === id ? { ...company, active: !company.active } : company
    ));

    const company = companies.find(c => c.id === id);
    const status = company?.active ? 'deactivated' : 'activated';
    
    toast({
      title: `Company ${status}`,
      description: `${company?.name} has been ${status} successfully.`,
    });
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    
    form.reset({
      name: company.name,
      adminName: company.adminName,
      adminEmail: company.adminEmail,
      adminPassword: '', // Password field is empty when editing
      subdomain: company.subdomain,
      userLimit: company.userLimit,
      campaignLimit: company.campaignLimit,
      lmsCampaignLimit: company.lmsCampaignLimit,
    });
    
    setIsDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingCompany) {
      // Update existing company
      const updatedCompanies = companies.map(company => 
        company.id === editingCompany.id 
          ? { 
              ...company, 
              name: data.name,
              adminName: data.adminName,
              adminEmail: data.adminEmail,
              subdomain: data.subdomain,
              userLimit: data.userLimit,
              campaignLimit: data.campaignLimit,
              lmsCampaignLimit: data.lmsCampaignLimit
            } 
          : company
      );
      
      setCompanies(updatedCompanies);
      
      toast({
        title: "Company updated",
        description: `${data.name} has been updated successfully.`,
      });
    } else {
      // Add new company
      handleAddCompany(data);
    }
    
    setEditingCompany(null);
    setIsDialogOpen(false);
  };

  const openNewCompanyDialog = () => {
    setEditingCompany(null);
    form.reset({
      name: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      subdomain: '',
      userLimit: 50,
      campaignLimit: 10,
      lmsCampaignLimit: 5,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-[#907527]" />
          Company Management
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewCompanyDialog} className="bg-[#907527] hover:bg-[#705b1e]">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "Edit Company" : "Add New Company"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input placeholder="acmecorp" {...field} />
                            <span className="ml-2 text-sm text-gray-500">.yourdomain.com</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!editingCompany && (
                    <FormField
                      control={form.control}
                      name="adminPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temporary Password</FormLabel>
                          <FormControl>
                            <Input placeholder="Min. 6 characters" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="userLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Limit</FormLabel>
                        <FormControl>
                          <Input placeholder="50" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="campaignLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Limit</FormLabel>
                        <FormControl>
                          <Input placeholder="10" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lmsCampaignLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LMS Campaign Limit</FormLabel>
                        <FormControl>
                          <Input placeholder="5" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">
                    {editingCompany ? "Save Changes" : "Add Company"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Subdomain</TableHead>
              <TableHead>Limits (Users/Campaigns/LMS)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>
                  <div>{company.adminName}</div>
                  <div className="text-xs text-gray-500">{company.adminEmail}</div>
                </TableCell>
                <TableCell>{company.subdomain}.yourdomain.com</TableCell>
                <TableCell>
                  {company.userLimit} / {company.campaignLimit} / {company.lmsCampaignLimit}
                </TableCell>
                <TableCell>
                  {company.active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditCompany(company)}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleCompanyStatus(company.id)}
                    className={company.active 
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                      : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }
                  >
                    {company.active ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

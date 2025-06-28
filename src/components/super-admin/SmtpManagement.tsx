
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Edit, Check, X, Send } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface SmtpConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  authorizedCompanies: string[];
  active: boolean;
}

interface Company {
  id: string;
  name: string;
}

export const SmtpManagement = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SmtpConfig | null>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Mock companies data
  const [companies] = useState<Company[]>([
    { id: '1', name: 'Acme Corp' },
    { id: '2', name: 'TechSolutions Inc.' },
    { id: '3', name: 'Global Enterprises' },
    { id: '4', name: 'New Startup' },
  ]);

  // Mock SMTP configurations
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([
    {
      id: 'smtp1',
      name: 'Primary SMTP Server',
      host: 'smtp.example.com',
      port: 587,
      username: 'user@example.com',
      password: 'password',
      fromEmail: 'security@example.com',
      fromName: 'Security Team',
      authorizedCompanies: ['1', '2', '3', '4'],
      active: true
    },
    {
      id: 'smtp2',
      name: 'Secondary SMTP Server',
      host: 'smtp2.example.com',
      port: 465,
      username: 'user2@example.com',
      password: 'password2',
      fromEmail: 'notifications@example.com',
      fromName: 'Notification System',
      authorizedCompanies: ['1', '2'],
      active: true
    },
    {
      id: 'smtp3',
      name: 'Marketing Server',
      host: 'smtp-marketing.example.com',
      port: 587,
      username: 'marketing@example.com',
      password: 'password3',
      fromEmail: 'marketing@example.com',
      fromName: 'Marketing Department',
      authorizedCompanies: ['3'],
      active: false
    }
  ]);

  // Create form schema
  const smtpSchema = z.object({
    name: z.string().min(1, "Configuration name is required"),
    host: z.string().min(1, "SMTP host is required"),
    port: z.coerce.number().min(1, "Port is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    fromEmail: z.string().email("Invalid email address"),
    fromName: z.string().min(1, "From name is required"),
    authorizedCompanies: z.array(z.string()).optional(),
    active: z.boolean().default(true)
  });

  const form = useForm({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      name: '',
      host: '',
      port: 587,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      authorizedCompanies: [],
      active: true
    }
  });

  const handleEditConfig = (config: SmtpConfig) => {
    setEditingConfig(config);
    form.reset({
      name: config.name,
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      authorizedCompanies: config.authorizedCompanies,
      active: config.active
    });
    setIsDialogOpen(true);
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    form.reset({
      name: '',
      host: '',
      port: 587,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      authorizedCompanies: [],
      active: true
    });
    setIsDialogOpen(true);
  };

  const toggleConfigStatus = (id: string) => {
    setSmtpConfigs(smtpConfigs.map(config => 
      config.id === id ? { ...config, active: !config.active } : config
    ));

    const config = smtpConfigs.find(c => c.id === id);
    const status = config?.active ? 'deactivated' : 'activated';
    
    toast({
      title: `SMTP configuration ${status}`,
      description: `"${config?.name}" has been ${status} successfully.`,
    });
  };

  const handleTestConfig = (config: SmtpConfig) => {
    setEditingConfig(config);
    setTestEmail('');
    setIsTestDialogOpen(true);
  };

  const handleSendTestEmail = () => {
    if (!testEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter a valid email address.",
      });
      return;
    }

    // In a real app, this would send a test email
    toast({
      title: "Test email sent",
      description: `A test email has been sent to ${testEmail} using ${editingConfig?.name}.`,
    });
    
    setIsTestDialogOpen(false);
  };

  const onSubmit = (data: any) => {
    if (editingConfig) {
      // Update existing configuration
      const updatedConfigs = smtpConfigs.map(config => 
        config.id === editingConfig.id 
          ? { 
              ...config,
              name: data.name,
              host: data.host,
              port: data.port,
              username: data.username,
              password: data.password,
              fromEmail: data.fromEmail,
              fromName: data.fromName,
              authorizedCompanies: data.authorizedCompanies || [],
              active: data.active
            } 
          : config
      );
      
      setSmtpConfigs(updatedConfigs);
      
      toast({
        title: "SMTP configuration updated",
        description: `"${data.name}" has been updated successfully.`,
      });
    } else {
      // Add new configuration
      const newConfig: SmtpConfig = {
        id: `smtp${smtpConfigs.length + 1}`,
        name: data.name,
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        authorizedCompanies: data.authorizedCompanies || [],
        active: data.active
      };

      setSmtpConfigs([...smtpConfigs, newConfig]);
      
      toast({
        title: "SMTP configuration added",
        description: `"${data.name}" has been added successfully.`,
      });
    }
    
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#907527]" />
          SMTP Configuration Management
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddConfig} className="bg-[#907527] hover:bg-[#705b1e]">
              <Plus className="h-4 w-4 mr-2" />
              Add SMTP Config
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingConfig ? 'Edit SMTP Configuration' : 'Add New SMTP Configuration'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configuration Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Primary SMTP Server" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-focus"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input placeholder="587" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input placeholder="password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email</FormLabel>
                        <FormControl>
                          <Input placeholder="security@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Security Team" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="authorizedCompanies"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Authorized Companies</FormLabel>
                      </div>
                      <div className="border rounded-md p-4 space-y-2">
                        {companies.map((company) => (
                          <div key={company.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`company-${company.id}`}
                              checked={(field.value || []).includes(company.id)}
                              onCheckedChange={(checked) => {
                                const updatedCompanies = checked
                                  ? [...(field.value || []), company.id]
                                  : (field.value || []).filter(id => id !== company.id);
                                field.onChange(updatedCompanies);
                              }}
                            />
                            <Label htmlFor={`company-${company.id}`}>{company.name}</Label>
                          </div>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">
                    {editingConfig ? 'Save Changes' : 'Add Configuration'}
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
              <TableHead>Name</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>From Email</TableHead>
              <TableHead>Authorized Companies</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {smtpConfigs.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-medium">{config.name}</TableCell>
                <TableCell>{config.host}:{config.port}</TableCell>
                <TableCell>
                  <div>{config.fromEmail}</div>
                  <div className="text-xs text-gray-500">{config.fromName}</div>
                </TableCell>
                <TableCell>
                  {config.authorizedCompanies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {config.authorizedCompanies.length <= 2 ? (
                        config.authorizedCompanies.map(id => (
                          <Badge key={id} variant="outline">
                            {companies.find(c => c.id === id)?.name}
                          </Badge>
                        ))
                      ) : (
                        <>
                          <Badge variant="outline">
                            {companies.find(c => c.id === config.authorizedCompanies[0])?.name}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-100">
                            +{config.authorizedCompanies.length - 1} more
                          </Badge>
                        </>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">None</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {config.active ? (
                    <Badge variant="success" className="flex items-center w-fit">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center w-fit">
                      <X className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditConfig(config)}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConfig(config)}
                    className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleConfigStatus(config.id)}
                    className={config.active 
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                      : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }
                  >
                    {config.active ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send Test Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingConfig && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Send a test email using the <strong>{editingConfig.name}</strong> configuration.</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Recipient Email</Label>
                    <Input
                      id="test-email"
                      placeholder="Enter recipient email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={handleSendTestEmail}>
                  <Send className="h-4 w-4 mr-1" />
                  Send Test Email
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { EMAIL_CONFIGS_API_ENDPOINT, EMAIL_TEMPLATES_API_ENDPOINT, PHISHING_CAMPAIGN_CREATE_API_ENDPOINT } from '@/config';
import MainLayout from '@/components/layout/MainLayout';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userService, authService, User, Department, fetchWithAuth } from '@/services/api';
import SentEmailsList from '@/components/email/SentEmailsList';

// Helper function to get CSRF token from cookies
function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
      return cookiePart.split(';').shift() || null;
    }
  }
  return null;
}

const Sender = () => {
  const { companySlug } = useParams<{ companySlug?: string }>();
  const { toast } = useToast();
  
  // Define interface for email configurations
  interface EmailConfig {
    id: number;
    host: string;
    port: number;
    host_user: string;
    is_active: boolean;
  }
  
  // Define interface for email templates
  interface EmailTemplate {
    id: number;
    subject: string;
    content: string;
    company: number | null;
    company_name: string | null;
    is_global: boolean;
  }

  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    from: '', // Will be set from selected configuration
    subject: '',
    body: ''
  });
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [campaignName, setCampaignName] = useState(''); // State for campaign name input
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // State for company users
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // State for departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentLoadError, setDepartmentLoadError] = useState<string | null>(null);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  
  // State for all users selection
  const [selectAllUsers, setSelectAllUsers] = useState(false);

  const previewEditableRef = useRef<HTMLDivElement>(null);
  const imageFilePastedRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync formData.body to the editable preview div
    // This is important if formData.body is changed programmatically (e.g., loading a template)
    if (previewEditableRef.current && formData.body !== previewEditableRef.current.innerHTML) {
      previewEditableRef.current.innerHTML = formData.body;
    }
  }, [formData.body]);

  // Fetch users from the current company and get current user profile
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setUserLoadError(null);
        
        const usersData = await userService.getUsers();
        setUsers(usersData);
        
        // Get current user profile
        const profile = await authService.getProfile();
        setCurrentUser(profile);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUserLoadError(error instanceof Error ? error.message : 'Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Fetch departments from the current company
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        setDepartmentLoadError(null);
        
        const departmentsData = await userService.getDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartmentLoadError(error instanceof Error ? error.message : 'Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);

  // Fetch email configurations when component mounts
  // Fetch email templates based on company slug
  useEffect(() => {
    const fetchEmailTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        setTemplateLoadError(null);
                
        // Construct URL with company slug if available
        let url = EMAIL_TEMPLATES_API_ENDPOINT;
        if (companySlug) {
          url += `?company_slug=${companySlug}`;
        }
        
        // Make the request
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
                
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch email templates: ${response.status} ${response.statusText}`);
        }
        
        const data: EmailTemplate[] = await response.json();
        setEmailTemplates(data);
      } catch (error) {
        console.error('Error fetching email templates:', error);
        setTemplateLoadError(error instanceof Error ? error.message : 'Failed to load email templates');
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    
    fetchEmailTemplates();
  }, [companySlug]);

  useEffect(() => {
    const fetchEmailConfigs = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
                
        // First make an OPTIONS request to handle CORS preflight
        try {
          const optionsResponse = await fetch(EMAIL_CONFIGS_API_ENDPOINT, {
            method: 'OPTIONS',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Request-Method': 'GET',
              'Access-Control-Request-Headers': 'content-type',
            },
          });
          
        } catch (error) {
          console.warn('OPTIONS request failed, continuing anyway:', error);
        }
        
        // Now make the actual GET request
        const response = await fetch(EMAIL_CONFIGS_API_ENDPOINT, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Don't include credentials for now to avoid CORS issues
          // credentials: 'include',
        });
                
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch email configurations: ${response.status} ${response.statusText}`);
        }
        
        const data: EmailConfig[] = await response.json();
        setEmailConfigs(data);
        
        // Select the active configuration by default
        const activeConfig = data.find(config => config.is_active);
        if (activeConfig) {
          setSelectedConfigId(activeConfig.id);
          setFormData(prev => ({
            ...prev,
            from: activeConfig.host_user
          }));
        }
      } catch (error) {
        console.error('Error fetching email configurations:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load email configurations');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmailConfigs();
  }, []);

  // Handle configuration selection change
  const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const configId = parseInt(e.target.value);
    setSelectedConfigId(configId);
    
    // Update the from email based on the selected configuration
    const selectedConfig = emailConfigs.find(config => config.id === configId);
    if (selectedConfig) {
      setFormData(prev => ({
        ...prev,
        from: selectedConfig.host_user
      }));
    }
  };

  // Handle template selection change
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = parseInt(e.target.value);
    setSelectedTemplateId(templateId);
    
    if (templateId) {
      // Find the selected template
      const selectedTemplate = emailTemplates.find(template => template.id === templateId);
      if (selectedTemplate) {
        // Update form data with template content
        setFormData(prev => ({
          ...prev,
          subject: selectedTemplate.subject,
          body: selectedTemplate.content
        }));
      }
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle recipient checkbox change
  const handleRecipientChange = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedRecipients(prev => [...prev, email]);
    } else {
      setSelectedRecipients(prev => prev.filter(e => e !== email));
    }
  };
  
  // Handle department checkbox change
  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments(prev => [...prev, departmentId]);
    } else {
      setSelectedDepartments(prev => prev.filter(id => id !== departmentId));
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter departments based on search term
  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );

  // Get all users from selected departments
  const getDepartmentUsers = (departmentIds: string[]): User[] => {
    return users.filter(user => 
      user.department && departmentIds.includes(user.department)
    );
  };
  
  // Get all user emails
  const getAllUserEmails = (): string[] => {
    return users.map(user => user.email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    let currentCampaignId: number | null = null;

    try {
      if (!campaignName.trim()) {
        toast({
        variant: 'destructive',
        title: 'Campaign Name Required',
        description: 'Please enter a campaign name to proceed.',
      });
        return;
      }

      // 1. Create Campaign if campaignName (from state) is provided
      if (campaignName.trim() && companySlug) {
        if (!startDate || !endDate) {
          toast({
            variant: 'destructive',
            title: 'Dates Required',
            description: 'Please select a start and end date for the campaign.',
          });
          setIsSending(false);
          return;
        }

        if (new Date(endDate) < new Date(startDate)) {
          toast({
            variant: 'destructive',
            title: 'Invalid Date Range',
            description: 'End date cannot be before the start date.',
          });
          setIsSending(false);
          return;
        }

        const csrfToken = getCookie('csrftoken');
        const accessToken = localStorage.getItem('token');
        if (!accessToken) {
            toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Authentication token not found. Please log in again.',
          });
            setIsLoading(false);
            return;
        }
        if (!csrfToken) {
          // Attempt to fetch CSRF via OPTIONS if not present
          const optionsCsrfResponse = await fetch(PHISHING_CAMPAIGN_CREATE_API_ENDPOINT, { method: 'OPTIONS', credentials: 'include' });
          if (!optionsCsrfResponse.ok) {
            toast({
              title: 'CSRF Token Error',
              description: 'Failed to establish secure connection for campaign creation.',
              variant: 'destructive',
            });
          } // Do not throw, let getCookie try again
        }
        
        const finalCsrfToken = getCookie('csrftoken');
        if (!finalCsrfToken) {
            toast({
                title: 'CSRF Token Missing',
                description: 'Cannot create campaign. Please refresh and try again.',
                variant: 'destructive',
            });
        } else {
          try {
            const campaignResponse = await fetchWithAuth(PHISHING_CAMPAIGN_CREATE_API_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': finalCsrfToken,
                'X-Requested-With': 'XMLHttpRequest',
              },
              credentials: 'include',
              body: JSON.stringify({
                campaign_name: campaignName.trim(),
                company_slug: companySlug,
                start_date: startDate || null,
                end_date: endDate || null,
                recipients: selectAllUsers ? getAllUserEmails() : [...selectedRecipients, ...getDepartmentUsers(selectedDepartments).map(user => user.email)],
                sender_id: currentUser?.id,
                subject: formData.subject,
                body: formData.body,
                from: formData.from,
              }),
            });
            const campaignResult = await campaignResponse.json();
            if (!campaignResponse.ok) {
              throw new Error(campaignResult.detail || campaignResult.error || 'Failed to create campaign');
            }
            currentCampaignId = campaignResult.id;
            toast({
              title: 'Campaign Created',
              description: 'The phishing campaign and associated emails have been created successfully.',
            });
          } catch (campaignError) {
            console.error('Error creating campaign:', campaignError);
            toast({
              title: 'Campaign Creation Failed',
              description: campaignError instanceof Error ? campaignError.message : 'An unknown error occurred during campaign creation.',
              variant: 'destructive',
            });
            // Email sending will proceed even if campaign creation fails for now
          }
        }
      }

      // Reset form or redirect
      setCampaignName('');
    } catch (error) {
      console.error('Error sending email:', error);
      let errorMessage = 'Failed to send email';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Your session has expired. Please log in again.';
          // The fetchWithAuth interceptor should handle the redirection
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && previewEditableRef.current) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const imgTagHTML = `<img src="${base64String}" alt="Uploaded Image" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" />`;

        const previewDiv = previewEditableRef.current!;
        previewDiv.focus(); 

        const selection = window.getSelection();
        let inserted = false;
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (previewDiv.contains(range.commonAncestorContainer)) {
            // Attempt to insert HTML at the cursor position
            if (document.execCommand('insertHTML', false, imgTagHTML)) {
                inserted = true;
            }
          }
        }

        if (!inserted) {
          // Fallback: if execCommand failed or selection was not suitable
          previewDiv.innerHTML += imgTagHTML;
        }

        // After modification, ensure formData.body is updated from the contentEditable div's innerHTML
        const newBody = previewDiv.innerHTML;
        if (formData.body !== newBody) {
          setFormData(prev => ({ ...prev, body: newBody }));
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow selecting the same file again if needed
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <MainLayout>
      <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Send Email</CardTitle>
        <CardDescription>Compose and send a new email message</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Tabs defaultValue="individuals" className="w-full" onValueChange={(value) => {
                    // Clear other tabs when switching
                    if (value === 'individuals') {
                      setSelectedDepartments([]);
                      setSelectAllUsers(false);
                    } else if (value === 'departments') {
                      setSelectedRecipients([]);
                      setSelectAllUsers(false);
                    } else if (value === 'all-users') {
                      setSelectedRecipients([]);
                      setSelectedDepartments([]);
                    }
                  }}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="individuals">Individual Recipients</TabsTrigger>
                  <TabsTrigger value="departments">Departments</TabsTrigger>
                  <TabsTrigger value="all-users">All Users</TabsTrigger>
                </TabsList>
                
                <TabsContent value="individuals" className="border rounded-md p-2">
                  <div className="mb-2">
                    <Input
                      id="search-recipients"
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  
                  {userLoadError && <p className="text-red-500 text-sm mb-2">{userLoadError}</p>}
                  
                  {loadingUsers ? (
                    <p className="text-sm text-gray-500 p-2">Loading users...</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      {searchTerm ? 'No users found matching your search.' : 'No users found in this company.'}
                    </p>
                  ) : (
                    <ScrollArea className="h-60 pr-4">
                      <div className="space-y-2">
                        {filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`user-${user.id}`}
                              checked={selectedRecipients.includes(user.email)}
                              onCheckedChange={(checked) => handleRecipientChange(user.email, checked === true)}
                            />
                            <Label 
                              htmlFor={`user-${user.id}`}
                              className="flex-1 cursor-pointer flex justify-between"
                            >
                              <span>{user.first_name} {user.last_name}</span>
                              <span className="text-gray-500 text-sm">{user.email}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  
                  <div className="mt-2 text-sm text-gray-500">
                    {selectedRecipients.length} individual recipient(s) selected
                  </div>
                </TabsContent>
                
                <TabsContent value="departments" className="border rounded-md p-2">
                  <div className="mb-2">
                    <Input
                      id="search-departments"
                      type="text"
                      placeholder="Search departments..."
                      value={departmentSearchTerm}
                      onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  
                  {departmentLoadError && <p className="text-red-500 text-sm mb-2">{departmentLoadError}</p>}
                  
                  {loadingDepartments ? (
                    <p className="text-sm text-gray-500 p-2">Loading departments...</p>
                  ) : filteredDepartments.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      {departmentSearchTerm ? 'No groups found matching your search.' : 'No groups found in this company.'}
                    </p>
                  ) : (
                    <ScrollArea className="h-60 pr-4">
                      <div className="space-y-2">
                        {filteredDepartments.map((department) => (
                          <div key={department.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`department-${department.id}`}
                              checked={selectedDepartments.includes(department.id)}
                              onCheckedChange={(checked) => handleDepartmentChange(department.id, checked === true)}
                            />
                            <Label 
                              htmlFor={`department-${department.id}`}
                              className="flex-1 cursor-pointer flex justify-between"
                            >
                              <span>{department.name}</span>
                              <span className="text-gray-500 text-sm">{department.user_count} users</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  
                  <div className="mt-2 text-sm text-gray-500">
                    {selectedDepartments.length} department(s) selected
                    {selectedDepartments.length > 0 && (
                      <span> (approx. {getDepartmentUsers(selectedDepartments).length} users)</span>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="all-users" className="border rounded-md p-2">
                  <div className="flex items-center space-x-2 p-4">
                    <Checkbox 
                      id="select-all-users"
                      checked={selectAllUsers}
                      onCheckedChange={(checked) => setSelectAllUsers(checked === true)}
                    />
                    <Label 
                      htmlFor="select-all-users"
                      className="flex-1 cursor-pointer"
                    >
                      Select all users in the company ({users.length} users)
                    </Label>
                  </div>
                  
                  <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> This will send the email to all {users.length} users in the company. 
                      Please ensure your email content is appropriate for all recipients.
                    </p>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    {selectAllUsers ? (
                      <p>All {users.length} users will receive this email.</p>
                    ) : (
                      <p>No users selected. Check the box above to select all users.</p>
                    )}
                  </div>
                </TabsContent>


              </Tabs>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailConfig">Email Configuration</Label>
              <select
                id="emailConfig"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedConfigId || ''}
                onChange={handleConfigChange}
                disabled={isLoading || emailConfigs.length === 0}
                required
              >
                {isLoading ? (
                  <option value="">Loading configurations...</option>
                ) : emailConfigs.length === 0 ? (
                  <option value="">No configurations available</option>
                ) : (
                  <>
                    <option value="">Select email configuration</option>
                    {emailConfigs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.host_user} ({config.host}:{config.port})
                      </option>
                    ))}
                  </>
                )}
              </select>
              {loadError && <p className="text-red-500 text-sm mt-1">{loadError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                type="text"
                placeholder="e.g., Q3 Security Awareness Training"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailTemplate">Email Template</Label>
              <select
                id="emailTemplate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedTemplateId || ''}
                onChange={handleTemplateChange}
                disabled={isLoadingTemplates || emailTemplates.length === 0}
              >
                {isLoadingTemplates ? (
                  <option value="">Loading templates...</option>
                ) : emailTemplates.length === 0 ? (
                  <option value="">No templates available</option>
                ) : (
                  <>
                    <option value="">Select email template</option>
                    {emailTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.subject} {template.is_global ? '(Global)' : template.company_name ? `(${template.company_name})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {templateLoadError && <p className="text-red-500 text-sm mt-1">{templateLoadError}</p>}
            </div>
            
            {/*
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="email"
                placeholder="sender@example.com"
                name="from" // Added name attribute for consistency
                value={formData.from}
                onChange={handleChange}
                disabled // This field is derived from config
                // required // Not required if disabled and auto-filled
              />
            </div>
            */}
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                placeholder="Email subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              {/* New Textarea for HTML editing */}
              <div className="space-y-1">
                <Label htmlFor="body-html">HTML Code</Label>
                <Textarea
                  id="body-html"
                  name="body" // Ensures handleChange updates formData.body
                  placeholder="Write your HTML code here..."
                  rows={8}
                  value={formData.body}
                  onChange={handleChange} // Assumes handleChange is defined to handle textarea
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              {/* Existing WYSIWYG editor, now acting more as a preview but still editable */}
              <div className="space-y-1 mt-4">
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="body-editor">Message Preview (Editable)</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={() => imageFilePastedRef.current?.click()}
                  >
                    Insert Image
                  </Button>
                </div>
                <input
                  type="file"
                  ref={imageFilePastedRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div
                  id="body-editor"
                  ref={previewEditableRef}
                  contentEditable={true}
                  className="p-4 border rounded-md bg-white mt-1 min-h-[200px] overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  onInput={(e: React.FormEvent<HTMLDivElement>) => {
                    const newBody = e.currentTarget.innerHTML;
                    if (formData.body !== newBody) {
                      setFormData(prev => ({ ...prev, body: newBody }));
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </CardContent>
      </Card>
      
      {/* Add the SentEmailsList component to automatically check email read status */}
      {currentUser && (
        <SentEmailsList 
          currentUser={currentUser}
        />
      )}
    </MainLayout>
  );
};

export default Sender;

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from '@/components/ui/calendar';
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, X, Calendar as CalendarIcon, Check, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { userService, fetchWithAuth, authService } from "@/services/api";
import { 
  EMAIL_API_ENDPOINT,
  EMAIL_SAVE_API_ENDPOINT,
  EMAIL_CONFIGS_API_ENDPOINT, 
  EMAIL_TEMPLATES_API_ENDPOINT,
  PHISHING_CAMPAIGN_CREATE_API_ENDPOINT 
} from "@/config";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to get CSRF token from cookies
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Define interfaces for email configurations and templates
interface EmailConfig {
  id: number;
  host: string;
  port: number;
  host_user: string;
  is_active: boolean;
}

interface EmailTemplate {
  id: number;
  subject: string;
  content: string;
  company: number | null;
  company_name: string | null;
  is_global: boolean;
  name: string;
}

interface CampaignFormProps {
  companySlug: string;
  onClose: () => void;
  onCreate: () => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ companySlug, onClose, onCreate }) => {
  const { toast } = useToast();
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // Form state
  const [targetType, setTargetType] = useState('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('17:00');
  const [isSending, setIsSending] = useState(false);
  
  // Get current user from auth context
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  
  // Refs
  const previewEditableRef = useRef<HTMLDivElement>(null);

  // Fetch email configurations and templates on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch email configurations
        const configsResponse = await fetchWithAuth(EMAIL_CONFIGS_API_ENDPOINT);
        const configsData = await configsResponse.json();
        setEmailConfigs(configsData);
        if (configsData.length > 0) {
          setSelectedConfigId(configsData[0].id);
        }
        
        // Fetch email templates
        const templatesResponse = await fetchWithAuth(EMAIL_TEMPLATES_API_ENDPOINT);
        const templatesData = await templatesResponse.json();
        setEmailTemplates(templatesData);
        
        // Fetch users and departments
        const [users, depts] = await Promise.all([
          userService.getUsers(),
          userService.getDepartments()
        ]);
        
        setUsers(users);
        setDepartments(depts);
        setLoadingUsers(false);
        setLoadingDepartments(false);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load required data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
        setIsLoadingTemplates(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter employees based on search
  const filteredEmployees = users.filter(user => 
    !selectedEmployees.find(selected => selected.id === user.id) &&
    (user.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
     user.email?.toLowerCase().includes(employeeSearch.toLowerCase()))
  );

  // Toggle department selection
  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };
  
  // Add employee to selection
  const addEmployee = (employee: any) => {
    setSelectedEmployees(prev => [...prev, employee]);
    setEmployeeSearch('');
  };
  
  // Remove employee from selection
  const removeEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };

  // Handle form submission
  const sendEmails = async (campaignId: number, targetUsers: number[]) => {
    try {
      // Get the selected template
      const selectedTemplate = emailTemplates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) {
        throw new Error('Selected template not found');
      }

      // Get the selected email config
      const selectedConfig = emailConfigs.find(c => c.id === selectedConfigId);
      if (!selectedConfig) {
        throw new Error('Selected email configuration not found');
      }


      const successfulSends: string[] = [];
      const failedSends: { email: string; error: string }[] = [];

      // Get the target users' details
      const targetUserDetails = users.filter(user => targetUsers.includes(user.id));

      for (const user of targetUserDetails) {
        try {
          // Personalize the email body
          const recipientName = `${user.first_name} ${user.last_name}`;
          const personalizedBody = selectedTemplate.content
            .replace(/\{recipient\.name\}/g, recipientName);

          // 1. Save the email
          if (!currentUser?.id) {
            console.error('Current user data:', currentUser);
            throw new Error('No authenticated user found. Please log in again.');
          }

          const savePayload = {
            to: user.email,
            from: selectedConfig.host_user,
            subject: selectedTemplate.subject,
            body: personalizedBody,
            phishing_campaign_id: campaignId,
            sender_id: parseInt(currentUser.id),  // Ensure it's a number
            email_service_config_id: selectedConfigId,
          };
          

          const saveResponse = await fetch(EMAIL_SAVE_API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(savePayload),
          });

          const saveResponseData = await saveResponse.json();
          if (!saveResponse.ok) {
            throw new Error(`Failed to save email: ${saveResponseData.error || saveResponseData.detail || 'Unknown error'}`);
          }

          // 2. Send the email
          const sendPayload = {
            to: user.email,
            from: selectedConfig.host_user,
            subject: selectedTemplate.subject,
            body: personalizedBody,
            email_id: saveResponseData.email_id,
            phishing_campaign_id: campaignId,
          };

          const sendResponse = await fetchWithAuth(EMAIL_API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(sendPayload),
          });

          if (!sendResponse.ok) {
            const errorData = await sendResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to send email');
          }

          successfulSends.push(user.email);
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
          failedSends.push({ 
            email: user.email, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Show results
      if (failedSends.length > 0) {
        toast({
          title: 'Partial Success',
          description: `Sent to ${successfulSends.length} recipients, failed for ${failedSends.length}.`,
          variant: 'default',
        });
      }

      return { success: true, successfulSends, failedSends };
    } catch (error) {
      console.error('Error in sendEmails:', error);
      throw error;
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!campaignName || !selectedConfigId || !selectedTemplateId || !startDate || !endDate || !startHour || !endHour) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields, including dates and times.",
        variant: "destructive"
      });
      return;
    }
    
    // Combine date and time and validate
    const startDateTime = new Date(startDate);
    const [startH, startM] = startHour.split(':').map(Number);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(endDate);
    const [endH, endM] = endHour.split(':').map(Number);
    endDateTime.setHours(endH, endM, 0, 0);

    if (startDateTime >= endDateTime) {
      toast({
        title: "Invalid Date Range",
        description: "End date and time must be after start date and time.",
        variant: "destructive"
      });
      return;
    }
    
    // Get target users based on selection
    let targetUsers: number[] = [];
    
    if (targetType === 'all') {
      // Get all users
      targetUsers = users.map(user => user.id);
    } else if (targetType === 'department') {
      // Get users from selected departments
      if (selectedDepartments.length === 0) {
        toast({
          title: "No Groups Selected",
          description: "Please select at least one Group",
          variant: "destructive"
        });
        return;
      }
      
      targetUsers = users
        .filter(user => user.department && selectedDepartments.includes(user.department.toString()))
        .map(user => user.id);
    } else {
      // Get selected individual users
      if (selectedEmployees.length === 0) {
        toast({
          title: "No Employees Selected",
          description: "Please select at least one employee",
          variant: "destructive"
        });
        return;
      }
      
      targetUsers = selectedEmployees.map(user => user.id);
    }
    
    if (targetUsers.length === 0) {
      toast({
        title: "No Valid Targets",
        description: "No users match your selection criteria",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // 1. Create the campaign
      const campaignResponse = await fetchWithAuth(PHISHING_CAMPAIGN_CREATE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_name: campaignName,
          company_slug: companySlug,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
        }),
      });

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create campaign');
      }

      const campaignData = await campaignResponse.json();
      const campaignId = campaignData.id;

      // 2. Send emails to all target users
      await sendEmails(campaignId, targetUsers);


      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      });
      
      // Reset form
      setCampaignName('');
      setSelectedConfigId(emailConfigs[0]?.id || null);
      setSelectedTemplateId(null);
      setStartDate(undefined);
      setEndDate(undefined);
      setStartHour('09:00');
      setEndHour('17:00');
      setTargetType('all');
      setSelectedDepartments([]);
      setSelectedEmployees([]);
      
      // Call the onCreate callback
      onCreate();
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create campaign',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading campaign form...</div>;
  }

  const currentCompanyId = Number(currentUser.company);
  const selectedTemplate = emailTemplates.find(t => t.id === selectedTemplateId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="campaign-name">Campaign Name <span className="text-red-500">*</span></Label>
        <Input
          id="campaign-name"
          placeholder="Enter campaign name"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Email Configuration <span className="text-red-500">*</span></Label>
        <Select 
          value={selectedConfigId?.toString() || ''} 
          onValueChange={(value) => setSelectedConfigId(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an email configuration" />
          </SelectTrigger>
          <SelectContent>
            {emailConfigs.map((config) => (
              <SelectItem key={config.id} value={config.id.toString()}>
                {config.host_user} ({config.host}:{config.port})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template selection and preview side-by-side */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Template selector */}
        <div className="space-y-2 flex-1">
          <Label>Email Template <span className="text-red-500">*</span></Label>
          <Select 
            value={selectedTemplateId?.toString() || ''} 
            onValueChange={(value) => setSelectedTemplateId(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates
                .filter((template) => template.is_global || (currentCompanyId !== null && template.company === currentCompanyId))
                .map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name || template.subject} 
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview pane */}
        <div className="flex-1 space-y-2">
          <Label>Preview</Label>
          <div className="border rounded p-4 max-h-96 overflow-y-auto text-sm">
            {selectedTemplate ? (
              <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
            ) : (
              <p className="text-muted-foreground">Select a template to preview its content.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date & Time <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => {
                    // Disable dates before today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
            <Input 
              type="time" 
              value={startHour} 
              onChange={(e) => setStartHour(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date & Time <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => {
                    // Disable dates before start date or today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (startDate) {
                      return date < startDate;
                    }
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
            <Input 
              type="time" 
              value={endHour} 
              onChange={(e) => setEndHour(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Target Audience <span className="text-red-500">*</span></Label>
        <Tabs value={targetType} onValueChange={setTargetType} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="department">By Group</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="department" className="space-y-2">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Groups..."
                  className="pl-8"
                  value={departmentSearchTerm}
                  onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                {loadingDepartments ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Loading Groups...
                  </p>
                ) : departments.filter(dept => 
                  dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
                ).length > 0 ? (
                  departments
                    .filter(dept => dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase()))
                    .map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`dept-${dept.id}`} 
                          checked={selectedDepartments.includes(dept.id.toString())}
                          onCheckedChange={() => toggleDepartment(dept.id.toString())}
                        />
                        <Label htmlFor={`dept-${dept.id}`} className="text-sm font-medium">
                          {dept.name} ({dept.user_count || 0} users)
                        </Label>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No Groups found
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="individual" className="space-y-2">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-8"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Loading employees...
                  </p>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">{user.name || 'Unnamed User'}</p>
                        <p className="text-xs text-muted-foreground">{user.email || 'No email'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addEmployee(user)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No employees found
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Selected Employees</Label>
              {selectedEmployees.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded">
                  {selectedEmployees.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">{user.name || 'Unnamed User'}</p>
                        <p className="text-xs text-muted-foreground">{user.email || 'No email'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmployee(user.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded">
                  No employees selected
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button variant="outline" disabled={isSending}>
            Cancel
          </Button>
        </DialogClose>
        <Button 
          onClick={handleCreateCampaign}
          disabled={isSending || !campaignName || !selectedConfigId || !selectedTemplateId || !startDate || !endDate || !startHour || !endHour}
        >
          {isSending ? 'Creating...' : 'Create Campaign'}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default CampaignForm;

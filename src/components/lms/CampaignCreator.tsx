import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, isBefore, startOfToday } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import axios from 'axios';
import API_ENDPOINTS, { getAuthHeaders } from '../../config/api';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/api';

// Interface for courses from API
interface Course {
  id: number | string;
  name: string;
  title?: string;
}

// Interface for users from API
interface User {
  id: number | string;
  name: string;
  username?: string;
  email?: string;
  department?: string;
}

interface Department {
  id: number | string;
  name: string;
}

// Interface for API response
type ApiResponse<T> = {
  data?: T;
  results?: T;
  detail?: string;
  message?: string;
};

interface CampaignCreatorProps {
  onCreate?: () => void;
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({ onCreate }) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = React.useState<boolean>(false);
  const [campaignName, setCampaignName] = React.useState<string>("");
  const today = startOfToday();
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  
  // Update end date if it's before start date when start date changes
  React.useEffect(() => {
    if (startDate && endDate && isBefore(endDate, startDate)) {
      setEndDate(undefined);
    }
  }, [startDate, endDate]);
  
  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  const [selectedTargetType, setSelectedTargetType] = React.useState<string>("all");
  const [enableCertificate, setEnableCertificate] = React.useState<boolean>(true);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState<boolean>(false);
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [selectedCourses, setSelectedCourses] = React.useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  
  // State for API data
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingCourses, setLoadingCourses] = React.useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  // Fetch courses, users, and departments when dialog opens
  React.useEffect(() => {
    if (open) {
      // Reset form state when dialog opens
      setCampaignName("");
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedTargetType("all");
      setSelectedUsers([]);
      setSelectedDepartments([]);
      setSelectedCourses([]);  
      setCurrentStep(1);
      
      // Fetch courses
      fetchCourses();
    }
  }, [open]);
  
  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.COURSES, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData: ApiResponse<unknown> = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || 
          errorData.message || 
          `Failed to fetch courses: ${response.status} ${response.statusText}`
        );
      }
      
      const responseData = await response.json() as Course[] | ApiResponse<Course[]>;
      
      // Handle different response formats
      const coursesData = Array.isArray(responseData) 
        ? responseData 
        : (responseData.results || responseData.data || []);
      
      // Format courses with required properties
      const formattedCourses = coursesData.map((course) => ({
        id: course.id,
        name: course.name || course.title || `Course ${course.id}`
      }));
      
      setCourses(formattedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load courses';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoadingCourses(false);
    }
  };
  
  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const departments = await userService.getDepartments();
      setDepartments(Array.isArray(departments) ? departments :[]);
    } catch (err) {
      console.error('Error fetching departments:', err);
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive'
      });
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch users from API using userService
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      
      const usersData = await userService.getUsers();
      
      // Format users with required properties
      const formattedUsers = usersData.map((user) => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || `User ${user.id}`,
        email: user.email || '',
        username: user.username || ''
      }));
      
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName.trim()) {
      toast({
        title: "Campaign Name Required",
        description: "Please enter a name for the campaign.",
        variant: "destructive",
      });
      return;
    }
    
    // Add the validation for selectedCourses here
    if (selectedCourses.length === 0) {
      toast({
        title: "Missing Courses",
        description: "Please select at least one course for the campaign.",
        variant: "destructive",
      });
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select both start and end dates for the campaign.",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the formData to use selectedCourses
      const formData: any = {
        name: campaignName,
        course_ids: selectedCourses,  
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        target_type: selectedTargetType,
      };
      
      // Handle user selection based on target type
      if (selectedTargetType === 'all') {
        // For 'All Users', fetch all users and include their IDs
        const allUsers = await userService.getUsers();
        if (allUsers.length === 0) {
          throw new Error('No users found to assign to this campaign');
        }
        formData.selected_users = allUsers.map(user => user.id.toString());
      } else if (selectedTargetType === 'department') {
        // For 'Department' selection, fetch users in selected departments
        if (selectedDepartments.length === 0) {
          throw new Error('Please select at least one department');
        }
        const allUsers = await userService.getUsers();
        const departmentUsers = allUsers.filter(user => 
          user.department && selectedDepartments.includes(user.department.toString())
        );
        
        if (departmentUsers.length === 0) {
          throw new Error('No users found in the selected departments');
        }
        
        formData.selected_users = departmentUsers.map(user => user.id.toString());
      } else {
        // For 'Custom' selection, use the selected users
        if (selectedUsers.length === 0) {
          throw new Error('Please select at least one user');
        }
        formData.selected_users = selectedUsers;
      }
      
      // Submit the campaign
      await axios.post(API_ENDPOINTS.CREATE_CAMPAIGN, formData, {
        headers: getAuthHeaders()
      });
      
      toast({
        title: "Campaign Created",
        description: "Your new training campaign has been created successfully.",
      });
      // Notify parent component
      if (onCreate) onCreate();
      
      // Close dialog and reset form
      setOpen(false);
      
      // Reset form
      setCampaignName('');
      setSelectedCourses([]);
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedTargetType('all');
      setSelectedUsers([]);
      setCurrentStep(1);
    } catch (err) {
      console.error('Error creating campaign:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTargetTypeChange = async (value: 'all' | 'custom' | 'department') => {
    setSelectedTargetType(value);
    
    // Reset selections when changing target type
    setSelectedUsers([]);
    setSelectedDepartments([]);
    
    // Load necessary data based on target type
    if (value === 'custom' && users.length === 0) {
      await fetchUsers();
    } else if (value === 'department' && departments.length === 0) {
      await fetchDepartments();
    }
  };



  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Training Campaign</DialogTitle>
            <DialogDescription>
              Set up a new training campaign for your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step} 
                    className={cn(
                      "h-2 w-6 rounded-full", 
                      currentStep >= step ? "bg-blue-500" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter campaign name" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Courses</Label>
                {loadingCourses ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Loading courses...</span>
                  </div>
                ) : (
                  <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                    {courses.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">No courses available</div>
                    ) : (
                      <div className="space-y-2">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`course-${course.id}`}
                              checked={selectedCourses.includes(course.id.toString())}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCourses([...selectedCourses, course.id.toString()]);
                                } else {
                                  setSelectedCourses(selectedCourses.filter((id) => id !== course.id.toString()));
                                }
                              }}
                            />
                            <Label htmlFor={`course-${course.id}`} className="text-sm font-normal">
                              {course.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label>Target Audience</Label>
                <Select 
                  value={selectedTargetType} 
                  onValueChange={handleTargetTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="department">By Group</SelectItem>
                    <SelectItem value="custom">Custom User Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTargetType === "department" && (
                <div className="grid gap-2">
                  <Label>Select Groups</Label>
                  {loadingDepartments ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Loading groups...</span>
                    </div>
                  ) : (
                    <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                      {departments.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-2">
                          No Groups available
                        </div>
                      ) : (
                        departments.map((dept) => (
                          <div key={dept.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`dept-${dept.id}`} 
                              checked={selectedDepartments.includes(dept.id.toString())}
                              onCheckedChange={() => {
                                setSelectedDepartments(prev => 
                                  prev.includes(dept.id.toString())
                                    ? prev.filter(id => id !== dept.id.toString())
                                    : [...prev, dept.id.toString()]
                                );
                              }}
                            />
                            <Label htmlFor={`dept-${dept.id}`} className="text-sm font-normal">
                              {dept.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedTargetType === "custom" && (
                <div className="grid gap-2">
                  <Label>Select Users</Label>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Loading users...</span>
                    </div>
                  ) : (
                    <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                      {users.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-2">
                          No users available
                        </div>
                      ) : (
                        users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`user-${user.id}`} 
                              checked={selectedUsers.includes(user.id.toString())}
                              onCheckedChange={() => toggleUser(user.id.toString())}
                            />
                            <Label htmlFor={`user-${user.id}`} className="text-sm font-normal">
                              {user.name} {user.department ? `(${user.department})` : ''}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
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
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          // Don't allow selecting past dates
                          const selectedDate = new Date(date);
                          if (isBefore(selectedDate, today)) {
                            toast({
                              title: "Invalid Date",
                              description: "Start date cannot be before today.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setStartDate(selectedDate);
                        }
                      }}
                      disabled={(date) => isBefore(date, today)}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
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
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) {
                          // Don't allow selecting dates before start date or today
                          const selectedDate = new Date(date);
                          const minDate = startDate || today;
                          
                          if (isBefore(selectedDate, minDate)) {
                            toast({
                              title: "Invalid Date",
                              description: `End date cannot be before ${format(minDate, 'MMM d, yyyy')}.`,
                              variant: "destructive",
                            });
                            return;
                          }
                          setEndDate(selectedDate);
                        }
                      }}
                      disabled={(date) => {
                        // Disable dates before today or before start date if set
                        const minDate = startDate || today;
                        return isBefore(date, minDate);
                      }}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label>Certificate Settings</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="enable-certificate" 
                    checked={enableCertificate}
                    onCheckedChange={(checked) => setEnableCertificate(!!checked)}
                  />
                  <Label htmlFor="enable-certificate" className="text-sm font-normal">
                    Enable completion certificate
                  </Label>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Campaign Summary</Label>
                <div className="space-y-2 text-sm border p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-muted-foreground">Campaign Name:</div>
                    <div>{campaignName || "Not specified"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-muted-foreground">Courses:</div>
                    <div>
                      {selectedCourses.length > 0
                        ? selectedCourses
                            .map((id) => courses.find((c) => c.id.toString() === id)?.name)
                            .filter(Boolean)
                            .join(", ")
                        : "Not selected"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-muted-foreground">Start Date:</div>
                    <div>{startDate ? format(startDate, "PPP") : "Not specified"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-muted-foreground">End Date:</div>
                    <div>{endDate ? format(endDate, "PPP") : "Not specified"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-muted-foreground">Target Audience:</div>
                    <div>{selectedTargetType === "all" ? "All Users" : "Custom Selection"}</div>
                  </div>
                  {selectedTargetType === "custom" && (
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-muted-foreground">Selected Users:</div>
                      <div>{selectedUsers.length} users</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-muted-foreground">Certificate:</div>
                    <div>{enableCertificate ? "Enabled" : "Disabled"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            <div className="flex-1"></div>
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-[#907527] hover:bg-[#7a6421]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/80"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default CampaignCreator;

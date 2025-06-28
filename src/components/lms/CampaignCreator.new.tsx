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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import axios from 'axios';

// Interface for courses from API
interface Course {
  id: number;
  name: string;
}

// Interface for users from API
interface User {
  id: number;
  name: string;
}

export const CampaignCreator = () => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState<boolean>(false);
  const [campaignName, setCampaignName] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [selectedTargetType, setSelectedTargetType] = React.useState<string>("all");
  const [enableCertificate, setEnableCertificate] = React.useState<boolean>(true);
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [selectedCourse, setSelectedCourse] = React.useState<string>("");
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  
  // State for API data
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingCourses, setLoadingCourses] = React.useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch courses and users when dialog opens
  React.useEffect(() => {
    if (open) {
      // Reset form state when dialog opens
      setCampaignName("");
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedTargetType("all");
      setSelectedUsers([]);
      setSelectedCourse("");
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
      const response = await axios.get('/lms/get_courses_for_company/');
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load courses. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoadingCourses(false);
    }
  };
  
  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      const response = await axios.get('/lms/get_users_for_company/');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateCampaign = async () => {
    // Validate form
    if (!campaignName) {
      toast({
        title: "Missing Campaign Name",
        description: "Please enter a name for the campaign.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCourse) {
      toast({
        title: "Missing Course",
        description: "Please select a course for the campaign.",
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
    
    // Prepare data for API
    const formData = {
      name: campaignName,
      course_id: selectedCourse,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      selected_users: selectedUsers
    };
    
    // Submit to API
    try {
      setIsSubmitting(true);
      await axios.post('/lms/api/campaigns/create/', formData);
      
      toast({
        title: "Campaign Created",
        description: "Your new training campaign has been created successfully.",
      });
      
      // Close dialog and reset form
      setOpen(false);
    } catch (err) {
      console.error('Error creating campaign:', err);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTargetTypeChange = (value: string) => {
    setSelectedTargetType(value);
    if (value === "all") {
      setSelectedUsers([]);
    } else if (value === "custom" && users.length === 0) {
      // Fetch users if not already loaded
      fetchUsers();
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
    <Dialog open={open} onOpenChange={setOpen}>
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
              <Label>Course</Label>
              {loadingCourses ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Loading courses...</span>
                </div>
              ) : (
                <Select 
                  value={selectedCourse} 
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No courses available
                      </div>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                  <SelectItem value="custom">Custom User Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
                            {user.name}
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
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
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
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    fromDate={startDate}
                    initialFocus
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
                  <div className="text-muted-foreground">Course:</div>
                  <div>
                    {courses.find(c => c.id.toString() === selectedCourse)?.name || "Not selected"}
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
              onClick={handleCreateCampaign} 
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
  );
};

export default CampaignCreator;

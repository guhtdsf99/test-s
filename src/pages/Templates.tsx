import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, PlusCircle, Mail, CreditCard, Gift, AlertTriangle, FileText, ShieldAlert, Share2, Briefcase, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import Video from '@/components/Video';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Mock template data
const templates = [{
  id: 1,
  name: 'Password Reset',
  category: 'Account Security',
  description: 'Email requesting password reset with suspicious link',
  difficulty: 'Easy',
  icon: <Mail className="h-10 w-10 text-phish-500" />
}, {
  id: 2,
  name: 'Payment Confirmation',
  category: 'Financial',
  description: 'Fake invoice or payment receipt with malicious attachment',
  difficulty: 'Medium',
  icon: <CreditCard className="h-10 w-10 text-phish-500" />
}, {
  id: 3,
  name: 'Gift Card Offer',
  category: 'Promotions',
  description: 'Free gift card offer requiring personal information',
  difficulty: 'Easy',
  icon: <Gift className="h-10 w-10 text-phish-500" />
}, {
  id: 4,
  name: 'Account Suspension',
  category: 'Account Security',
  description: 'Notification about account suspension requiring immediate action',
  difficulty: 'Medium',
  icon: <AlertTriangle className="h-10 w-10 text-phish-500" />
}, {
  id: 5,
  name: 'Document Share',
  category: 'Business',
  description: 'Shared document requiring login to view content',
  difficulty: 'Hard',
  icon: <FileText className="h-10 w-10 text-phish-500" />
}, {
  id: 6,
  name: 'Security Alert',
  category: 'Account Security',
  description: 'Urgent security alert requiring verification',
  difficulty: 'Medium',
  icon: <ShieldAlert className="h-10 w-10 text-phish-500" />
}, {
  id: 7,
  name: 'File Share Request',
  category: 'Business',
  description: 'Request to access shared files with suspicious URL',
  difficulty: 'Hard',
  icon: <Share2 className="h-10 w-10 text-phish-500" />
}, {
  id: 8,
  name: 'Job Opportunity',
  category: 'Career',
  description: 'Unsolicited job offer requiring personal information',
  difficulty: 'Medium',
  icon: <Briefcase className="h-10 w-10 text-phish-500" />
}];

// Template categories
const categories = ['All', 'Account Security', 'Financial', 'Promotions', 'Business', 'Career'];

// Difficulty levels
const difficultyLevels = ['All', 'Easy', 'Medium', 'Hard'];

// Mock departments
const departments = [{
  id: 'd1',
  name: 'IT'
}, {
  id: 'd2',
  name: 'HR'
}, {
  id: 'd3',
  name: 'Finance'
}, {
  id: 'd4',
  name: 'Marketing'
}, {
  id: 'd5',
  name: 'Operations'
}];
const Templates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [templateStartDate, setTemplateStartDate] = useState<Date>();
  const [templateEndDate, setTemplateEndDate] = useState<Date>();
  const [selectedTargetType, setSelectedTargetType] = useState<string>("all");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  const handleCreateTemplate = () => {
    // Get the company slug from the URL
    const path = window.location.pathname;
    const parts = path.split('/');
    const companySlug = parts[1]; // First part after the first slash
    
    // Navigate to the template editor with the company slug
    navigate(`/${companySlug}/template-editor`);
  };
  const handleUseTemplate = (templateId: number) => {
    if (!templateStartDate || !templateEndDate) {
      toast({
        title: "Campaign Dates Required",
        description: "Please set start and end dates for your campaign before using a template.",
        variant: "destructive"
      });
      return;
    }
    if (templateEndDate < templateStartDate) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date.",
        variant: "destructive"
      });
      return;
    }
    if (selectedTargetType === "departments" && selectedDepartments.length === 0) {
      toast({
        title: "Target Audience Required",
        description: "Please select at least one department for your campaign.",
        variant: "destructive"
      });
      return;
    }

    // Store dates and target audience in session storage to use them in the template editor
    sessionStorage.setItem('campaignStartDate', templateStartDate.toISOString());
    sessionStorage.setItem('campaignEndDate', templateEndDate.toISOString());
    sessionStorage.setItem('campaignTargetType', selectedTargetType);
    sessionStorage.setItem('campaignTargetDepartments', JSON.stringify(selectedDepartments));
    
    // Get the company slug from the URL
    const path = window.location.pathname;
    const parts = path.split('/');
    const companySlug = parts[1]; // First part after the first slash
    
    // Navigate to the template editor with the company slug and template ID
    navigate(`/${companySlug}/template-editor/${templateId}`);
  };
  const handleTargetTypeChange = (value: string) => {
    setSelectedTargetType(value);
    if (value === "all") {
      setSelectedDepartments([]);
    }
  };
  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments(prev => prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]);
  };
  return (
    <MainLayout>
      <div className="flex-grow bg-gray-50 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="phishing" className="space-y-4">
            <TabsList>
              <TabsTrigger value="phishing">Phishing Templates</TabsTrigger>
              
            </TabsList>

            <TabsContent value="phishing">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Phishing Templates</h1>
                  <p className="text-gray-600">Browse and customize templates for your phishing simulations</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Button className="bg-phish-600 hover:bg-phish-700" onClick={handleCreateTemplate}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Create Custom Template
                  </Button>
                </div>
              </div>

              {/* Search and filters */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search templates..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select id="category" className="w-full rounded-md border border-gray-300 p-2" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                      {categories.map(category => <option key={category} value={category}>
                          {category}
                        </option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select id="difficulty" className="w-full rounded-md border border-gray-300 p-2" value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)}>
                      {difficultyLevels.map(level => <option key={level} value={level}>
                          {level}
                        </option>)}
                    </select>
                  </div>
                </div>

                {/* Campaign date selection */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Campaign Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button id="startDate" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !templateStartDate && "text-muted-foreground")}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {templateStartDate ? format(templateStartDate, "PPP") : <span>Pick a start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={templateStartDate} onSelect={setTemplateStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button id="endDate" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !templateEndDate && "text-muted-foreground")}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {templateEndDate ? format(templateEndDate, "PPP") : <span>Pick an end date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={templateEndDate} onSelect={setTemplateEndDate} fromDate={templateStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Target audience selection */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Target Audience</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="targetType">Audience Type</Label>
                      <Select value={selectedTargetType} onValueChange={handleTargetTypeChange}>
                        <SelectTrigger id="targetType" className="mt-1">
                          <SelectValue placeholder="Select audience type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="departments">Specific Departments</SelectItem>
                          <SelectItem value="custom">Custom User Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedTargetType === "departments" && <div className="border p-3 rounded-md">
                        <Label className="block mb-2">Select Groups</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {departments.map(dept => <div key={dept.id} className="flex items-center space-x-2">
                              <Checkbox id={`template-${dept.id}`} checked={selectedDepartments.includes(dept.id)} onCheckedChange={() => toggleDepartment(dept.id)} />
                              <Label htmlFor={`template-${dept.id}`} className="text-sm font-normal">
                                {dept.name}
                              </Label>
                            </div>)}
                        </div>
                      </div>}
                    
                    {selectedTargetType === "custom" && <div className="space-y-2">
                        <Label htmlFor="templateUserSearch">Search Users</Label>
                        <div className="flex items-center space-x-2">
                          <Input id="templateUserSearch" placeholder="Search by name or email" />
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Use the advanced user selector to choose specific users
                        </div>
                      </div>}
                  </div>
                </div>
              </div>

              {/* Templates grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.length > 0 ? filteredTemplates.map(template => <Card key={template.id} className="border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="bg-phish-50 p-4 rounded-full mb-4">
                            {template.icon}
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                          <div className="flex items-center mb-2">
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {template.category}
                            </span>
                            <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${template.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : template.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {template.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{template.description}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="p-3 bg-gray-50 flex justify-center border-t border-gray-100">
                        <Button variant="outline" className="w-full text-phish-600 border-phish-200 hover:bg-phish-50" onClick={() => handleUseTemplate(template.id)}>
                          Use Template
                        </Button>
                      </CardFooter>
                    </Card>) : <div className="col-span-full py-12 text-center">
                    <p className="text-lg text-gray-600">No templates found matching your criteria.</p>
                  </div>}
              </div>
            </TabsContent>

            <TabsContent value="lms">
              

              
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};
export default Templates;
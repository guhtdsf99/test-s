
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LayoutTemplate, Search, Plus, Edit, Check, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  isDefault: boolean;
}

export const EmailTemplateManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Mock categories
  const categories = ['All', 'Phishing', 'Security', 'Awareness', 'General'];

  // Mock email templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 't1',
      name: 'Password Reset Request',
      subject: 'Your Password Reset Request',
      content: 'We received a request to reset your password. Please click the link below to reset it.',
      category: 'Phishing',
      isDefault: true
    },
    {
      id: 't2',
      name: 'Security Alert',
      subject: 'Security Alert: Unusual Login Detected',
      content: 'We noticed an unusual login attempt to your account. Please verify this login immediately.',
      category: 'Security',
      isDefault: true
    },
    {
      id: 't3',
      name: 'Free Gift Card',
      subject: 'You Have Won a $1000 Gift Card!',
      content: 'Congratulations! You have been randomly selected to receive a $1000 gift card. Click here to claim now.',
      category: 'Phishing',
      isDefault: false
    },
    {
      id: 't4',
      name: 'Security Training Reminder',
      subject: 'Reminder: Complete Your Security Training',
      content: 'This is a reminder to complete your mandatory security training by the end of the week.',
      category: 'Awareness',
      isDefault: true
    }
  ]);

  // Create form schema
  const templateSchema = z.object({
    name: z.string().min(1, "Template name is required"),
    subject: z.string().min(1, "Email subject is required"),
    content: z.string().min(1, "Email content is required"),
    category: z.string().min(1, "Category is required"),
    isDefault: z.boolean().default(false)
  });

  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      subject: '',
      content: '',
      category: '',
      isDefault: false
    }
  });

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
      isDefault: template.isDefault
    });
    setIsDialogOpen(true);
  };

  const handleAddNewTemplate = () => {
    setEditingTemplate(null);
    form.reset({
      name: '',
      subject: '',
      content: '',
      category: '',
      isDefault: false
    });
    setIsDialogOpen(true);
  };

  const toggleDefaultStatus = (id: string) => {
    setTemplates(templates.map(template => 
      template.id === id ? { ...template, isDefault: !template.isDefault } : template
    ));

    const template = templates.find(t => t.id === id);
    const status = template?.isDefault ? 'removed from' : 'set as';
    
    toast({
      title: "Default status updated",
      description: `"${template?.name}" has been ${status} default.`,
    });
  };

  const onSubmit = (data: any) => {
    if (editingTemplate) {
      // Update existing template
      const updatedTemplates = templates.map(template => 
        template.id === editingTemplate.id 
          ? { 
              ...template,
              name: data.name,
              subject: data.subject,
              content: data.content,
              category: data.category,
              isDefault: data.isDefault
            } 
          : template
      );
      
      setTemplates(updatedTemplates);
      
      toast({
        title: "Template updated",
        description: `"${data.name}" has been updated successfully.`,
      });
    } else {
      // Add new template
      const newTemplate: EmailTemplate = {
        id: `t${templates.length + 1}`,
        name: data.name,
        subject: data.subject,
        content: data.content,
        category: data.category,
        isDefault: data.isDefault
      };

      setTemplates([...templates, newTemplate]);
      
      toast({
        title: "Template added",
        description: `"${data.name}" has been added successfully.`,
      });
    }
    
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-[#907527]" />
          Email Template Management
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNewTemplate} className="bg-[#907527] hover:bg-[#705b1e]">
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Password Reset Request" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.filter(cat => cat !== 'All').map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Password Reset Request" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter email content..." 
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md p-4 border">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-focus"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as default template</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">
                    {editingTemplate ? 'Save Changes' : 'Add Template'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-full max-w-[200px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.subject}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{template.category}</Badge>
                </TableCell>
                <TableCell>
                  {template.isDefault ? (
                    <Badge variant="success" className="flex items-center w-fit">
                      <Check className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 w-fit">
                      <X className="h-3 w-3 mr-1" />
                      No
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleDefaultStatus(template.id)}
                    className={template.isDefault 
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                      : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }
                  >
                    {template.isDefault ? "Remove Default" : "Make Default"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-10">
            <LayoutTemplate className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium">No templates found</h3>
            <p className="text-gray-500">Try adjusting your search or filter.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

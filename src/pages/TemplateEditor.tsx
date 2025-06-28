import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Code, Type, RefreshCw } from 'lucide-react';

import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from '@/hooks/use-mobile';
import MainLayout from '@/components/layout/MainLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TemplateEditor = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("content");

  // Handle back button navigation
  const handleBackToTemplates = () => {
    const path = window.location.pathname;
    const parts = path.split('/');
    const companySlug = parts[1];
    navigate(`/${companySlug}/templates`);
  };

  const [editorMode, setEditorMode] = useState<'html' | 'preview'>('html');
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [templateMode, setTemplateMode] = useState<'new' | 'existing'>('new');
  // Preview dialog state for global templates
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Define interfaces first
  interface TemplateData {
    id: string;
    name: string;
    subject: string;
    content: string;
    difficulty: string;
    category: string;
  }

  interface TemplateOption {
    value: string;
    label: string;
    disabled?: boolean;
    isGlobal?: boolean;
  }

  // Template state
  const [template, setTemplate] = useState<TemplateData>({
    id: "",
    name: "",
    subject: "",
    content: "",
    difficulty: "medium",
    category: "",
  });

  // API response type
  interface EmailTemplate {
    id?: string | number;
    name: string;
    subject: string;
    content: string;
    difficulty: string;
    category: string;
    is_global?: boolean;
    company?: number | { id: number; slug: string };
  }

  const queryClient = useQueryClient();

  // Check authentication state
  const isAuthenticated = !!localStorage.getItem('access_token') || !!localStorage.getItem('token');

  // Get company slug from URL
  const path = window.location.pathname;
  const companySlug = path.split('/')[1];

  // Fetch email templates from the backend for the current company
  const { 
    data: templatesData = [], 
    isLoading: isLoadingTemplates,
    isError: isTemplatesError,
    error: templatesError,
    refetch: refetchTemplates 
  } = useQuery<EmailTemplate[]>({
    queryKey: ['emailTemplates', companySlug],
    queryFn: async () => {
      if (!isAuthenticated) {
        console.warn('Not authenticated, skipping template fetch');
        return [];
      }

      try {
        const response = await axios.get(API_ENDPOINTS.EMAIL_TEMPLATES, {
          headers: getAuthHeaders(),
          withCredentials: true,
          params: {
            company_slug: companySlug
          }
        });
        
        // First ensure we have valid data
        if (!Array.isArray(response.data)) {
          console.warn('Expected array of templates but got:', response.data);
          return [];
        }
        
        // Return all templates and let the backend handle the filtering
        // The backend should already be filtering by company based on the JWT token
        return response.data;
      } catch (error) {
        console.error('Error fetching templates:', error);
        if (error.response?.status === 401) {
          console.warn('Unauthorized - please log in again');
          // Consider redirecting to login here if needed
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!companySlug, // Only run the query if authenticated and company slug exists
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Debug effect to log template data changes
  useEffect(() => {
    
  }, [templatesData]);
  
  // Add manual refetch button for debugging
  const handleManualRefetch = useCallback(async () => {
    try {
      const { data } = await queryClient.fetchQuery({
        queryKey: ['emailTemplates', companySlug],
        queryFn: async () => {
          const response = await axios.get(API_ENDPOINTS.EMAIL_TEMPLATES, {
            headers: getAuthHeaders(),
            withCredentials: true,
            params: { company_slug: companySlug }
          });
          return response.data;
        }
      });
    } catch (error) {
      console.error('Manual fetch error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch templates',
        variant: 'destructive',
      });
    }
  }, [companySlug, queryClient]);

  // Format templates for dropdown with global template indicators
  const templateOptions = React.useMemo<TemplateOption[]>(() => {
    if (!Array.isArray(templatesData)) {
      console.warn('templatesData is not an array:', templatesData);
      return [];
    }
    
    if (templatesData.length === 0) {
      if (isLoadingTemplates) {
        return []; // Don't show message while loading
      }
      if (isTemplatesError) {
        toast({
          title: 'Error',
          description: 'Failed to load templates. Please try again.',
          variant: 'destructive',
        });
      }
      return [];
    }
    
    return templatesData.map(template => ({
      value: String(template.id || ''),
      label: template.is_global 
        ? `${template.name || `Template ${template.id || 'New'}`} (Global)`
        : template.name || `Template ${template.id || 'New'}`,
      isGlobal: template.is_global
    }));
  }, [templatesData, isLoadingTemplates, isTemplatesError, templatesError, isAuthenticated]);

  // Handle query errors
  useEffect(() => {
    if (isLoadingTemplates === false && templateOptions.length === 0 && isAuthenticated) {
      toast({
        title: 'No Templates',
        description: 'No templates found. Create a new one or check your connection.',
        variant: 'default',
      });
    }
  }, [isLoadingTemplates, templateOptions, isAuthenticated]);

  // Load template when selected from dropdown
  const loadTemplate = useCallback((templateId: string) => {
    if (!templateId || !templatesData) return;
    
    const selectedTemplate = templatesData.find(t => t.id?.toString() === templateId);
    if (selectedTemplate) {
      // Prevent loading global templates for editing
      if (selectedTemplate.is_global) {
        toast({
          title: 'Read-only',
          description: 'Global templates cannot be edited. Please create a new template instead.',
          variant: 'default',
        });
        setTemplateMode('new');
        setTemplate({
          id: '',
          name: '',
          subject: '',
          content: '',
          difficulty: 'medium',
          category: '',
        });
        return;
      }
      
      setTemplate({
        id: String(selectedTemplate.id || ''),
        name: selectedTemplate.name || '',
        subject: selectedTemplate.subject || '',
        content: selectedTemplate.content || '',
        difficulty: selectedTemplate.difficulty || 'medium',
        category: selectedTemplate.category || '',
      });
    }
  }, [templatesData]);

  // Handle template dropdown change
  const handleTemplateChange = (value: string) => {
    if (value === 'new') {
      setTemplate({
        id: '',
        name: '',
        subject: '',
        content: '',
        difficulty: 'medium',
        category: '',
      });
      setTemplateMode('new');
    } else {
      // Find selected template
      const selected = templatesData?.find(t => t.id?.toString() === value);
      if (selected && selected.is_global) {
        // Open preview dialog for global templates
        setPreviewTemplate(selected as EmailTemplate);
        setIsPreviewOpen(true);
        return;
      }
      loadTemplate(value);
      setTemplateMode('existing');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const isNew = templateMode === 'new' || !template.id;
      const endpoint = isNew 
        ? API_ENDPOINTS.EMAIL_TEMPLATES_CREATE 
        : `${API_ENDPOINTS.EMAIL_TEMPLATES}${template.id}/`;
      
      const method = isNew ? 'post' : 'put';
      const requestData: any = {
        name: template.name,
        subject: template.subject,
        content: template.content,
        difficulty: template.difficulty,
        category: template.category,
        is_global: false,
      };

      // Only include company_slug for new templates
      if (isNew && companySlug) {
        requestData.company_slug = companySlug;
      }
      
      const response = await axios({
        method,
        url: endpoint,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        withCredentials: true,
        data: requestData,
      });

      // Invalidate and refetch templates with the company slug
      await queryClient.invalidateQueries({ 
        queryKey: ['emailTemplates', companySlug] 
      });
      
      toast({
        title: "Success",
        description: isNew 
          ? "Template created successfully!" 
          : "Template updated successfully!",
      });

      // If it was a new template, update the form with the new template data
      if (isNew && response.data) {
        setTemplate(prev => ({
          ...prev,
          id: response.data.id,
          name: response.data.name,
        }));
        setTemplateMode('existing');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || 
                  error.response?.data?.message || 
                  Object.values(error.response?.data || {}).flat().join('\n') ||
                  "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get CSRF token
  const getCsrfToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Create a data URL for the image
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        const imgTag = `<img src="${resizedImageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; display: block; margin: 0 auto 20px;">`;
        
        // Insert at the beginning of the content
        setTemplate(prev => ({
          ...prev,
          content: imgTag + prev.content
        }));
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keep a ref to the current content and update state
  const currentContentRef = useRef(template.content);
  const isUpdatingRef = useRef(false);
  
  // Update the ref when template changes from outside (not from preview)
  useEffect(() => {
    if (!isUpdatingRef.current && previewRef.current) {
      currentContentRef.current = template.content;
      previewRef.current.innerHTML = template.content;
    }
  }, [template.content]);
  
  const pendingContentRef = useRef<string | null>(null);
  
  // Handle preview input changes with debounce
  const handlePreviewInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    
    const newContent = previewRef.current.innerHTML;
    currentContentRef.current = newContent;
    
    // Store the new content temporarily but don't update state yet
    pendingContentRef.current = newContent;
  }, []);
  
  // Handle Enter key in preview
  const handlePreviewKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const br = document.createElement('br');
        range.deleteContents();
        range.insertNode(br);
        range.setStartAfter(br);
        range.setEndAfter(br);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Update the content ref after Enter key
        if (previewRef.current) {
          const newContent = previewRef.current.innerHTML;
          currentContentRef.current = newContent;
          pendingContentRef.current = newContent;
        }
      }
    }
  }, []);

  // Handle blur to commit changes
  const handlePreviewBlur = useCallback(() => {
    if (pendingContentRef.current !== null) {
      setTemplate(prev => ({
        ...prev,
        content: pendingContentRef.current || ''
      }));
      pendingContentRef.current = null;
    }
  }, []);

  const PreviewPane = () => (
    <Card className="border-gray-100 h-full">
      <CardHeader className="border-b border-gray-100 bg-gray-50">
        <CardTitle className="text-lg">Message Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-medium">Subject:</span>
            <span>{template.subject}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: template.content }} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              onClick={handleSaveTemplate}
              disabled={isLoadingTemplates}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Template Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value="content" className="space-y-4">

                  <TabsContent value="content" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Template Mode</Label>
                        <div className="flex space-x-4">
                          <Button
                            type="button"
                            variant={templateMode === 'new' ? 'default' : 'outline'}
                            onClick={() => setTemplateMode('new')}
                            className="flex-1"
                          >
                            Add New Template
                          </Button>
                          <Button
                            type="button"
                            variant={templateMode === 'existing' ? 'default' : 'outline'}
                            onClick={() => setTemplateMode('existing')}
                            className="flex-1"
                          >
                            Edit Existing Template
                          </Button>
                        </div>
                      </div>

                      {templateMode === 'existing' ? (
                        <div className="space-y-2">
                          <Label htmlFor="select-template">Select Template</Label>
                          <Select
                            value={template.id || ''}
                            onValueChange={handleTemplateChange}
                            disabled={isLoadingTemplates}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder={
                                isLoadingTemplates ? 'Loading...' : 'Select a template'
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">Create New Template</SelectItem>
                              {templateOptions.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className={option.isGlobal ? 'opacity-50' : ''}
                                >
                                  {option.label}
                                  {option.isGlobal && (
                                    <span className="ml-2 text-xs text-muted-foreground">(Read-only)</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="template-name">Template Name</Label>
                          <Input
                            id="template-name"
                            value={template.name}
                            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                            placeholder="Enter template name"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              className="h-4 w-4 text-blue-600"
                              checked={template.difficulty === "easy"}
                              onChange={() => setTemplate({ ...template, difficulty: "easy" })}
                            />
                            <span className="ml-2">Easy</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              className="h-4 w-4 text-blue-600"
                              checked={template.difficulty === "medium"}
                              onChange={() => setTemplate({ ...template, difficulty: "medium" })}
                            />
                            <span className="ml-2">Medium</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              className="h-4 w-4 text-blue-600"
                              checked={template.difficulty === "hard"}
                              onChange={() => setTemplate({ ...template, difficulty: "hard" })}
                            />
                            <span className="ml-2">Hard</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={template.subject}
                          onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                          placeholder="Enter email subject"
                        />
                      </div>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm"
                        >
                          Insert Image
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Email Content</Label>
                          <ToggleGroup 
                            type="single" 
                            value={editorMode}
                            onValueChange={(value) => value && setEditorMode(value as 'html' | 'preview')}
                            className="h-8"
                          >
                            <ToggleGroupItem value="html" className="text-xs px-3">
                              <Code className="h-3.5 w-3.5 mr-1" />
                              HTML
                            </ToggleGroupItem>
                            <ToggleGroupItem value="preview" className="text-xs px-3">
                              <Type className="h-3.5 w-3.5 mr-1" />
                              Preview
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                        
                        {editorMode === 'html' ? (
                          <div className="space-y-2">
                            <Textarea
                              className="w-full min-h-[400px] p-3 font-mono text-sm"
                              value={template.content}
                              onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                              placeholder="Enter your HTML content here..."
                            />
                          </div>
                        ) : (
                          <div 
                            ref={previewRef}
                            className="prose max-w-none p-4 border rounded min-h-[400px] bg-white"
                            contentEditable
                            dangerouslySetInnerHTML={{ __html: template.content }}
                            onInput={handlePreviewInput}
                            onBlur={handlePreviewBlur}
                            onKeyDown={handlePreviewKeyDown}
                            style={{ 
                              outline: 'none',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                              minHeight: '400px',
                              cursor: 'text'
                            }}
                            suppressContentEditableWarning={true}
                          />
                        )}
                      </div>

                      
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <PreviewPane />
          </div>
        </div>
      </div>
      {/* Global template preview dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name || previewTemplate?.subject || 'Template Preview'}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewTemplate.content }} />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TemplateEditor;

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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Code, Type } from 'lucide-react';


import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LandingPageTemplateEditor = () => {
  const { toast } = useToast();

  const [editorMode, setEditorMode] = useState<'html' | 'preview'>('html');
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [templateMode, setTemplateMode] = useState<'new' | 'existing'>('new');
  const [previewTemplate, setPreviewTemplate] = useState<LandingPageTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  interface TemplateData {
    id: string;
    name: string;
    slug: string;
    content: string;
  }

  interface TemplateOption {
    value: string;
    label: string;
    isGlobal?: boolean;
  }

  const [template, setTemplate] = useState<TemplateData>({
    id: "",
    name: "",
    slug: "",
    content: "",
  });

  interface LandingPageTemplate {
    id?: string | number;
    name: string;
    slug: string;
    content: string;
    is_global?: boolean;
    company?: number | { id: number; slug: string };
  }

  const queryClient = useQueryClient();
  const isAuthenticated = !!localStorage.getItem('access_token') || !!localStorage.getItem('token');
  const companySlug = window.location.pathname.split('/')[1];

  const { 
    data: templatesData = [], 
    isLoading: isLoadingTemplates,
  } = useQuery<LandingPageTemplate[]>({
    queryKey: ['landingPageTemplates', companySlug],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await axios.get(API_ENDPOINTS.LANDING_PAGE_TEMPLATES, {
        headers: getAuthHeaders(),
        withCredentials: true,
        params: { company_slug: companySlug }
      });
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: isAuthenticated && !!companySlug,
  });

  const templateOptions = React.useMemo<TemplateOption[]>(() => {
    return templatesData.map(t => ({
      value: String(t.id || ''),
      label: t.is_global ? `${t.name} (Global)` : t.name,
      isGlobal: t.is_global
    }));
  }, [templatesData]);

  const loadTemplate = useCallback((templateId: string) => {
    const selected = templatesData.find(t => t.id?.toString() === templateId);
    if (selected) {
      if (selected.is_global) {
        // Prefill a new template based on the global one so it can be customised
        setTemplateMode('new');
        setIsPreviewOpen(false);
        setPreviewTemplate(null);
        setTemplate({
          id: '',
          name: selected.name || '',
          slug: selected.slug || '',
          content: selected.content || '',
        });
        toast({
          title: 'Global template copied',
          description: 'You are now creating a new landing page template based on the selected global template. Give it a unique name.',
        });
        return;
      }
      setTemplate({
        id: String(selected.id || ''),
        name: selected.name || '',
        slug: selected.slug || '',
        content: selected.content || '',
      });
    }
  }, [templatesData, toast]);

  const handleTemplateChange = (value: string) => {
    if (value === 'new') {
      setTemplate({ id: '', name: '', slug: '', content: '' });
      setTemplateMode('new');
    } else {
      const selected = templatesData?.find(t => t.id?.toString() === value);
      if (selected?.is_global) {
        // Switch to new mode with copied content
        setTemplateMode('new');
        setIsPreviewOpen(false);
        setPreviewTemplate(null);
        setTemplate({
          id: '',
          name: selected.name || '',
          slug: selected.slug || '',
          content: selected.content || '',
        });
        return;
      }
      loadTemplate(value);
      setTemplateMode('existing');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const isNew = templateMode === 'new' || !template.id;

      // Prevent duplicate names when creating a new template
      if (isNew) {
        const duplicate = templatesData.some(t => t.name.trim().toLowerCase() === template.name.trim().toLowerCase());
        if (duplicate) {
          toast({
            title: 'Duplicate name',
            description: 'A landing page template with that name already exists. Please choose a different name.',
            variant: 'destructive'
          });
          return;
        }
      }

      const url = isNew 
        ? API_ENDPOINTS.LANDING_PAGE_TEMPLATES_CREATE 
        : `${API_ENDPOINTS.LANDING_PAGE_TEMPLATES}${template.id}/`;
      
      const method = isNew ? 'post' : 'put';
      const requestData: any = { name: template.name, slug: template.slug, content: template.content };
      if (isNew && companySlug) requestData.company_slug = companySlug;
      
      const response = await axios({ method, url, data: requestData, headers: getAuthHeaders(), withCredentials: true });

      await queryClient.invalidateQueries({ queryKey: ['landingPageTemplates', companySlug] });
      
      toast({ title: "Success", description: `Template ${isNew ? 'created' : 'updated'} successfully!` });

      if (isNew && response.data) {
        setTemplate(prev => ({ ...prev, id: response.data.id, name: response.data.name, slug: response.data.slug }));
        setTemplateMode('existing');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const imgTag = `<img src="${e.target?.result}" alt="Uploaded image" style="max-width: 100%;">`;
      setTemplate(prev => ({ ...prev, content: imgTag + prev.content }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreviewInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    setTemplate(prev => ({ ...prev, content: e.currentTarget.innerHTML }));
  }, []);

  useEffect(() => {
    if (templateMode === 'new') {
      const newSlug = template.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setTemplate(t => ({ ...t, slug: newSlug }));
    }
  }, [template.name, templateMode]);

  const PreviewPane = () => (
    <Card className="border-gray-100 h-full">
      <CardHeader className="border-b border-gray-100 bg-gray-50">
        <CardTitle className="text-lg">Page Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          title="Landing page preview"
          srcDoc={template.content}
          sandbox="allow-same-origin"
          className="w-full h-[500px] border-0 rounded-b-md"
        />
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-end mb-6">
          <Button size="sm" onClick={handleSaveTemplate} disabled={isLoadingTemplates}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Landing Page Template Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value="content" className="space-y-4">
                  <TabsContent value="content" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Template Mode</Label>
                        <div className="flex space-x-4">
                          <Button type="button" variant={templateMode === 'new' ? 'default' : 'outline'} onClick={() => { /* keep current template so content persists */ setTemplateMode('new'); }} className="flex-1">New Template</Button>
                          <Button type="button" variant={templateMode === 'existing' ? 'default' : 'outline'} onClick={() => setTemplateMode('existing')} className="flex-1">Edit Existing</Button>
                        </div>
                      </div>

                      {templateMode === 'existing' && (
                        <div className="space-y-2">
                          <Label>Select Template</Label>
                          <Select onValueChange={handleTemplateChange} value={template.id || undefined}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templateOptions.map(option => (
                                <SelectItem key={option.value} value={option.value} className={option.isGlobal ? 'opacity-50' : ''}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Template name only when creating / duplicating */}
                       <div className="space-y-2" style={{ display: templateMode === 'new' ? 'block' : 'none' }}>
                         <Label htmlFor="template-name">Template Name</Label>
                         <Input
                           id="template-name"
                           value={template.name}
                           onChange={(e) => setTemplate(t => ({ ...t, name: e.target.value }))}
                           placeholder="e.g., Quarterly Update"
                         />
                       </div>

                      {/* Slug always visible so user can adjust */}
                      <div className="space-y-2">
                        <Label htmlFor="template-slug">Slug</Label>
                        <Input
                          id="template-slug"
                          value={template.slug}
                          onChange={(e) => setTemplate(t => ({ ...t, slug: e.target.value }))}
                          placeholder="e.g., quarterly-update"
                        />
                      </div>

                      <div className="space-y-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-sm">Insert Image</Button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Page Content</Label>
                          <ToggleGroup type="single" value={editorMode} onValueChange={value => value && setEditorMode(value as 'html' | 'preview')} className="h-8">
                            <ToggleGroupItem value="html" className="text-xs px-3"><Code className="h-3.5 w-3.5 mr-1" />HTML</ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                        
                        {editorMode === 'html' ? (
                          <Textarea className="w-full min-h-[400px] p-3 font-mono text-sm" value={template.content} onChange={e => setTemplate({ ...template, content: e.target.value })} placeholder="Enter your HTML content here..." />
                        ) : (
                          <iframe
                            title="Inline preview"
                            srcDoc={template.content}
                            sandbox="allow-same-origin"
                            className="w-full min-h-[400px] border rounded bg-white"
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
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name || 'Template Preview'}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <iframe
              title="Dialog preview"
              srcDoc={previewTemplate.content}
              sandbox="allow-same-origin"
              className="w-full h-[70vh] border-0 rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LandingPageTemplateEditor;

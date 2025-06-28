
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Type, Image as ImageIcon, Link as LinkIcon, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Save, Send, Text } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

// Template presets for different types of phishing emails
const templatePresets = [
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Urgent: Your Account Password Needs Reset',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0;">
        <img src="https://via.placeholder.com/200x50" alt="Company Logo" style="max-width: 200px;">
      </div>
      <div style="background-color: #f8f8f8; border-left: 4px solid #d63031; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; font-weight: bold; color: #d63031;">Security Alert: Immediate Action Required</p>
      </div>
      <p>Dear ${"{recipient.name}"},</p>
      <p>Our security system has detected unusual login attempts on your account from an unrecognized device. To ensure your account security, your password has been temporarily locked.</p>
      <p>Please reset your password immediately by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password Now</a>
      </div>
      <p>If you did not attempt to log in, please reset your password immediately and contact our support team.</p>
      <p>This link will expire in 24 hours for security reasons.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply directly to this email. If you need assistance, please contact support@example.com.</p>
    </div>`
  },
  {
    id: 'invoice-payment',
    name: 'Invoice Payment',
    subject: 'Invoice #INV-2025-04-13 Payment Required',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0;">
        <img src="https://via.placeholder.com/200x50" alt="Company Logo" style="max-width: 200px;">
      </div>
      <p>Dear ${"{recipient.name}"},</p>
      <p>This is a reminder that invoice <strong>#INV-2025-04-13</strong> for the amount of <strong>$${"{invoice.amount}"}</strong> is due for payment.</p>
      <div style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Invoice Summary:</strong></p>
        <p style="margin: 5px 0;">Invoice Number: #INV-2025-04-13</p>
        <p style="margin: 5px 0;">Amount Due: $${"{invoice.amount}"}</p>
        <p style="margin: 5px 0;">Due Date: ${"{invoice.dueDate}"}</p>
      </div>
      <p>To view and pay this invoice, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background-color: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View and Pay Invoice</a>
      </div>
      <p>If you have already made this payment, please disregard this message.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">This is an automated message from the Accounting department. For questions regarding this invoice, please contact accounting@example.com.</p>
    </div>`
  },
  {
    id: 'document-share',
    name: 'Shared Document',
    subject: 'Important Document Shared with You',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0;">
        <img src="https://via.placeholder.com/200x50" alt="Company Logo" style="max-width: 200px;">
      </div>
      <p>Hello ${"{recipient.name}"},</p>
      <p>${"{sender.name}"} has shared an important document with you.</p>
      <div style="background-color: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Document Details:</strong></p>
        <p style="margin: 5px 0;">Name: ${"{document.name}"}</p>
        <p style="margin: 5px 0;">Shared by: ${"{sender.name}"}</p>
        <p style="margin: 5px 0;">Date shared: ${"{document.date}"}</p>
        <p style="margin: 5px 0;">Message: "Please review this document as soon as possible."</p>
      </div>
      <p>To view and download this document, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Document</a>
      </div>
      <p>This shared link will expire in 7 days.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">If you're having trouble viewing this document, please ensure you're logged into your account or contact IT support.</p>
    </div>`
  }
];

// Sample poster images for the email templates
const posterOptions = [
  { id: 'security-alert', name: 'Security Alert', src: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop' },
  { id: 'invoice', name: 'Invoice Payment', src: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop' },
  { id: 'document', name: 'Document Share', src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop' },
  { id: 'tech-support', name: 'Tech Support', src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop' },
  { id: 'account-update', name: 'Account Update', src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop' },
];

const MailTemplateEditor = () => {
  const [currentTemplate, setCurrentTemplate] = useState({
    subject: 'Important: Your Account Security Requires Attention',
    from: 'security@company.org',
    fromName: 'IT Security Department',
    content: templatePresets[0].content,
    contentType: 'text', // 'text' or 'image'
    selectedPoster: posterOptions[0],
  });
  
  const [activeTab, setActiveTab] = useState("visual");
  const form = useForm({
    defaultValues: {
      contentType: "text"
    }
  });
  
  const handleTemplateChange = (templateId) => {
    const template = templatePresets.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplate({
        ...currentTemplate,
        subject: template.subject,
        content: template.content
      });
    }
  };

  const handlePosterChange = (posterId) => {
    const poster = posterOptions.find(p => p.id === posterId);
    if (poster) {
      setCurrentTemplate({
        ...currentTemplate,
        selectedPoster: poster,
        contentType: 'image'
      });
    }
  };
  
  const handleContentTypeChange = (value) => {
    setCurrentTemplate({
      ...currentTemplate,
      contentType: value
    });
  };
  
  const handleSaveTemplate = () => {
    toast({
      title: "Template Saved",
      description: "Your email template has been saved successfully.",
    });
  };
  
  const handleSendTest = () => {
    toast({
      title: "Test Email Sent",
      description: "A test email has been sent to your address.",
    });
  };

  // Generate the content based on the content type
  const getEmailContent = () => {
    if (currentTemplate.contentType === 'image') {
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <img src="https://via.placeholder.com/200x50" alt="Company Logo" style="max-width: 200px;">
        </div>
        <div style="background-color: #f8f8f8; border-left: 4px solid #d63031; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; color: #d63031;">IMPORTANT MESSAGE</p>
        </div>
        <p>Dear \${"{recipient.name}"},</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${currentTemplate.selectedPoster.src}" alt="${currentTemplate.selectedPoster.name}" style="max-width: 100%; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        </div>
        <p>Please click the button below to view important information:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply directly to this email.</p>
      </div>`;
    }
    return currentTemplate.content;
  };
  
  return (
    <Card className="border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-phish-600" />
          <CardTitle>Email Template Design</CardTitle>
        </div>
        <CardDescription>
          Design the phishing email that will be sent to your target audience
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="subject" className="mb-2 block">Email Subject</Label>
              <Input 
                id="subject"
                placeholder="Enter email subject"
                value={currentTemplate.subject}
                onChange={(e) => setCurrentTemplate({...currentTemplate, subject: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="template" className="mb-2 block">Template Type</Label>
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templatePresets.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromName" className="mb-2 block">Sender Name</Label>
              <Input 
                id="fromName"
                placeholder="Sender Name"
                value={currentTemplate.fromName}
                onChange={(e) => setCurrentTemplate({...currentTemplate, fromName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="from" className="mb-2 block">Sender Email</Label>
              <Input 
                id="from"
                placeholder="sender@example.com"
                value={currentTemplate.from}
                onChange={(e) => setCurrentTemplate({...currentTemplate, from: e.target.value})}
              />
            </div>
          </div>

          {/* Content Type Selection */}
          <div className="border border-border rounded-md p-4">
            <Form {...form}>
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Email Content Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleContentTypeChange(value);
                        }}
                        defaultValue={currentTemplate.contentType}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="text" />
                          <Label htmlFor="text" className="flex items-center gap-2">
                            <Text className="h-4 w-4" />
                            <span>Rich Text Email</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="image" id="image" />
                          <Label htmlFor="image" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>Email with Featured Image</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </Form>

            {currentTemplate.contentType === 'image' && (
              <div className="mt-4">
                <Label htmlFor="poster" className="mb-2 block">Select Featured Image</Label>
                <Select onValueChange={handlePosterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select image" />
                  </SelectTrigger>
                  <SelectContent>
                    {posterOptions.map((poster) => (
                      <SelectItem key={poster.id} value={poster.id} className="flex items-center">
                        {poster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4 border rounded-md p-2">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img 
                    src={currentTemplate.selectedPoster.src} 
                    alt={currentTemplate.selectedPoster.name}
                    className="w-full h-auto max-h-40 object-cover rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div>
            <Tabs defaultValue="visual" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="visual" className="gap-1">
                  <Type className="h-4 w-4" />
                  <span>Visual Editor</span>
                </TabsTrigger>
                <TabsTrigger value="html" className="gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  <span>HTML</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual" className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-md">
                  <div className="flex flex-wrap gap-1 border-b p-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Bold className="h-4 w-4" />
                      <span className="sr-only">Bold</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Italic className="h-4 w-4" />
                      <span className="sr-only">Italic</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Underline className="h-4 w-4" />
                      <span className="sr-only">Underline</span>
                    </Button>
                    <span className="w-px h-8 bg-gray-200 mx-1"></span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <LinkIcon className="h-4 w-4" />
                      <span className="sr-only">Link</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ImageIcon className="h-4 w-4" />
                      <span className="sr-only">Image</span>
                    </Button>
                    <span className="w-px h-8 bg-gray-200 mx-1"></span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <List className="h-4 w-4" />
                      <span className="sr-only">Bullet List</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ListOrdered className="h-4 w-4" />
                      <span className="sr-only">Numbered List</span>
                    </Button>
                    <span className="w-px h-8 bg-gray-200 mx-1"></span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <AlignLeft className="h-4 w-4" />
                      <span className="sr-only">Align Left</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <AlignCenter className="h-4 w-4" />
                      <span className="sr-only">Align Center</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <AlignRight className="h-4 w-4" />
                      <span className="sr-only">Align Right</span>
                    </Button>
                  </div>
                  <div className="p-4">
                    <div dangerouslySetInnerHTML={{ __html: getEmailContent() }} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="html">
                <Textarea
                  className="min-h-[400px] font-mono text-sm"
                  value={getEmailContent()}
                  onChange={(e) => {
                    if (currentTemplate.contentType === 'text') {
                      setCurrentTemplate({...currentTemplate, content: e.target.value});
                    }
                  }}
                  readOnly={currentTemplate.contentType === 'image'}
                />
                {currentTemplate.contentType === 'image' && (
                  <p className="text-sm text-amber-600 mt-2">
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      HTML editing is disabled for image-based templates. Switch to "Rich Text Email" to edit HTML directly.
                    </span>
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" className="gap-2" onClick={handleSendTest}>
              <Send className="h-4 w-4" />
              <span>Send Test Email</span>
            </Button>
            <Button className="gap-2 bg-phish-600 hover:bg-phish-700" onClick={handleSaveTemplate}>
              <Save className="h-4 w-4" />
              <span>Save Template</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MailTemplateEditor;

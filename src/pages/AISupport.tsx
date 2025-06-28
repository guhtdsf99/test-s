import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, FileText, BrainCircuit, FileImage, BookOpen } from 'lucide-react';
import PhishingTopicSuggester from '@/components/ai/PhishingTopicSuggester';
import ReportInsightsAnalyzer from '@/components/ai/ReportInsightsAnalyzer';
import PhishingIdeaGenerator from '@/components/ai/PhishingIdeaGenerator';
import VideoTopicSuggester from '@/components/ai/VideoTopicSuggester';

const AISupport = () => {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-6 w-6 text-phish-600" />
              <h1 className="text-2xl font-bold text-gray-100">AI Support</h1>
            </div>
            <p className="text-gray-400">Get AI-powered assistance for your phishing awareness campaigns</p>
          </div>
        </div>
        
        {/* AI Tools */}
        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-6 grid-cols-4">
            <TabsTrigger value="suggestions" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="text-gray-100">Phishing</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-1">
              <FileImage className="h-4 w-4" />
              <span className="text-gray-100">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <BrainCircuit className="h-4 w-4" />
              <span className="text-gray-100">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-gray-100">Videos</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="suggestions">
            <PhishingTopicSuggester />
          </TabsContent>
          
          <TabsContent value="generator">
            <PhishingIdeaGenerator />
          </TabsContent>
          
          <TabsContent value="insights">
            <ReportInsightsAnalyzer />
          </TabsContent>

          <TabsContent value="videos">
            <div className="grid grid-cols-1 gap-6">
              <VideoTopicSuggester />
              
              <Card className="border-gray-700">
                <CardHeader>
                  <CardTitle>How to use Video AI Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4 text-gray-400">
                    <li className="flex gap-2">
                      <span className="font-medium text-purple-600">1.</span>
                      <p>Describe your training needs and target audience</p>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-purple-600">2.</span>
                      <p>Get AI-generated topic suggestions with recommended durations</p>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-purple-600">3.</span>
                      <p>Review and select the most relevant topics for your training</p>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-purple-600">4.</span>
                      <p>Create your training video based on the AI recommendations</p>
                    </li>
                  </ol>
                  
                  <div className="mt-6">
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                      <Link to="/employee-courses">View My Courses</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AISupport;

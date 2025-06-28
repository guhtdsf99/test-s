
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Lightbulb, ListChecks, Target } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Mock suggestion data
const mockSuggestions = [
  {
    id: 1,
    title: "Password Security Basics",
    description: "Cover fundamental password security practices and common mistakes to avoid.",
    duration: "5-7 minutes",
    targetAudience: "All Employees"
  },
  {
    id: 2,
    title: "Social Engineering Awareness",
    description: "Understanding and identifying common social engineering tactics.",
    duration: "8-10 minutes",
    targetAudience: "All Employees"
  },
  {
    id: 3,
    title: "Data Protection Best Practices",
    description: "Essential guidelines for protecting sensitive company data.",
    duration: "6-8 minutes",
    targetAudience: "Data Handlers"
  }
];

const VideoTopicSuggester = () => {
  const [customTopic, setCustomTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const handleGenerateIdeas = () => {
    if (!customTopic || !targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please provide both a topic description and target audience.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Generating suggestions",
      description: "Your video topic suggestions are being generated..."
    });
  };

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-500" />
          <CardTitle>Video Topic Generator</CardTitle>
        </div>
        <CardDescription>Get AI-powered training video topic suggestions</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe your training topic
          </label>
          <Textarea 
            placeholder="E.g., I need a video about password security best practices"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target audience
          </label>
          <Textarea 
            placeholder="E.g., New employees in the IT department"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleGenerateIdeas}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          Generate Video Topics
        </Button>

        <div className="space-y-4 mt-6">
          {mockSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-lg mb-1">{suggestion.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{suggestion.description}</p>
              <div className="flex gap-2 text-xs">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {suggestion.duration}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {suggestion.targetAudience}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center text-sm text-gray-500">
          <ListChecks className="h-4 w-4 mr-1" />
          <span>AI-powered suggestions based on your needs</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Target className="h-4 w-4 mr-1" />
          <span>Tailored for your audience</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default VideoTopicSuggester;

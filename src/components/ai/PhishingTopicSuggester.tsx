
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ListChecks, Target, Copy, CheckCircle } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Mock suggestion data (in a real app, this would come from an API)
const mockSuggestions = {
  executive: [
    { id: 1, title: "Urgent Board Meeting Changes", description: "Email appears to be from the board secretary with last-minute meeting agenda changes requiring immediate confirmation.", difficulty: "Hard", effectiveness: "High" },
    { id: 2, title: "Acquisition Document Review", description: "Confidential acquisition documents requiring urgent executive review and electronic signature.", difficulty: "Medium", effectiveness: "High" },
    { id: 3, title: "Executive Compensation Update", description: "HR portal login required to review updated executive compensation packages before public disclosure.", difficulty: "Medium", effectiveness: "High" }
  ],
  finance: [
    { id: 4, title: "Invoice Payment Verification", description: "Urgent invoice requiring immediate verification and payment authorization to avoid late fees.", difficulty: "Medium", effectiveness: "High" },
    { id: 5, title: "Tax Document Update", description: "IRS notification requiring immediate tax filing information update via provided portal.", difficulty: "Medium", effectiveness: "Medium" },
    { id: 6, title: "Audit Documentation Request", description: "External auditor requesting immediate access to financial documents via shared drive.", difficulty: "Hard", effectiveness: "High" }
  ],
  general: [
    { id: 7, title: "IT Security Update Required", description: "IT security requiring immediate password update due to potential security breach.", difficulty: "Easy", effectiveness: "Medium" },
    { id: 8, title: "HR Benefits Enrollment", description: "Final notice for benefits enrollment requiring immediate action to avoid coverage lapse.", difficulty: "Easy", effectiveness: "Medium" },
    { id: 9, title: "Company Survey With Incentive", description: "Quick company survey with gift card incentive for first 50 respondents.", difficulty: "Easy", effectiveness: "Medium" }
  ]
};

const PhishingTopicSuggester = () => {
  const [activeTab, setActiveTab] = useState<string>("executive");
  const [customScenario, setCustomScenario] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied to clipboard!",
      description: "The phishing scenario has been copied."
    });
    
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateCustom = () => {
    if (!customScenario.trim() || !targetAudience.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a scenario description and target audience.",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would call an AI API
    toast({
      title: "Generating suggestions",
      description: "Your custom phishing scenario is being analyzed..."
    });

    // Simulate a delay for API call
    setTimeout(() => {
      toast({
        title: "Suggestions ready!",
        description: "Custom phishing scenarios have been generated based on your input."
      });
    }, 2000);
  };

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <CardTitle>Phishing Topic Generator</CardTitle>
        </div>
        <CardDescription>Get AI-powered phishing campaign suggestions or create your own</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Ready Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Scenario</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-4">
            <div className="flex flex-wrap gap-2 mt-4">
              <Button 
                variant={activeTab === "executive" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("executive")}
                className={activeTab === "executive" ? "bg-phish-600" : ""}
              >
                Executive
              </Button>
              <Button 
                variant={activeTab === "finance" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("finance")}
                className={activeTab === "finance" ? "bg-phish-600" : ""}
              >
                Finance
              </Button>
              <Button 
                variant={activeTab === "general" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("general")}
                className={activeTab === "general" ? "bg-phish-600" : ""}
              >
                General
              </Button>
            </div>

            <div className="space-y-4 mt-6">
              {mockSuggestions[activeTab as keyof typeof mockSuggestions].map((suggestion) => (
                <div key={suggestion.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">{suggestion.title}</h3>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {suggestion.difficulty}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                        {suggestion.effectiveness}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">{suggestion.description}</p>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-xs" 
                      onClick={() => handleCopyToClipboard(suggestion.description, suggestion.id)}
                    >
                      {copiedId === suggestion.id ? (
                        <>
                          <CheckCircle className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom">
            <div className="space-y-4">
              <div>
                <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-1">
                  Describe your phishing scenario
                </label>
                <Textarea 
                  id="scenario"
                  placeholder="E.g., I need a scenario about a fake invoice payment that targets finance department"
                  value={customScenario}
                  onChange={(e) => setCustomScenario(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
                  Target audience
                </label>
                <Textarea 
                  id="audience"
                  placeholder="E.g., Finance team members with access to payment systems"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={handleGenerateCustom} 
                  className="w-full bg-phish-600 hover:bg-phish-700"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Suggestions
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center text-sm text-gray-500">
          <ListChecks className="h-4 w-4 mr-1" />
          <span>AI-powered suggestions based on effectiveness data</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Target className="h-4 w-4 mr-1" />
          <span>Tailored for your industry</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PhishingTopicSuggester;

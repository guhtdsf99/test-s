
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileImage, Wand2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const targetAudiences = [
  "Finance Department",
  "HR Department",
  "IT Department",
  "Sales Team",
  "Executive Team",
  "All Employees"
];

const PhishingIdeaGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [context, setContext] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // TODO: Integrate with actual AI service
      // This is a mockup response for demonstration
      setTimeout(() => {
        const mockIdea = `Phishing Scenario: IT Security Update Required
        
Target: ${targetAudience}
Context: ${context}

Scenario Details:
- Email appears to come from IT Security Department
- Claims urgent security patch needs to be installed
- Includes official-looking company branding
- Creates urgency through "account access limitation" warning
- Requests immediate action within 24 hours

Recommended Poster Theme:
- Corporate security visual theme
- Warning symbols and security icons
- Company color scheme
- Professional layout with clear call-to-action`;

        setGeneratedIdea(mockIdea);
        setPosterUrl('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop');
        
        toast({
          title: "Idea Generated",
          description: "Your phishing campaign idea has been generated successfully.",
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate phishing idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-phish-600" />
          <CardTitle>Phishing Idea Generator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <select
              id="targetAudience"
              className="w-full rounded-md border border-gray-300 p-2"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            >
              <option value="">Select target audience</option>
              {targetAudiences.map((audience) => (
                <option key={audience} value={audience}>
                  {audience}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context</Label>
            <Textarea
              id="context"
              placeholder="Enter any specific context or requirements for the phishing scenario..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full bg-phish-600 hover:bg-phish-700"
            disabled={loading}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Generate Idea & Poster"}
          </Button>

          {generatedIdea && (
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Generated Idea</Label>
                <div className="rounded-md border border-gray-200 p-4 whitespace-pre-wrap">
                  {generatedIdea}
                </div>
              </div>

              {posterUrl && (
                <div className="space-y-2">
                  <Label>Generated Poster</Label>
                  <div className="rounded-md border border-gray-200 p-2">
                    <img
                      src={posterUrl}
                      alt="Generated phishing campaign poster"
                      className="w-full h-auto rounded-md"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      // TODO: Implement poster selection logic
                      toast({
                        title: "Poster Selected",
                        description: "The poster has been added to your template.",
                      });
                    }}
                  >
                    Use This Poster
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhishingIdeaGenerator;

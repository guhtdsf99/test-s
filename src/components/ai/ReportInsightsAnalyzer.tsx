
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Clock, ArrowRight, AlertCircle, CheckCircle2, Lightbulb, Download } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Mock report data (in a real app, this would come from an API)
const mockInsights = {
  summary: {
    riskScore: 68,
    topRiskFactor: "Password Reset Emails",
    improvementRate: "+12%",
    analysisDate: "April 12, 2025"
  },
  keyFindings: [
    { 
      id: 1, 
      title: "Password Reset Campaigns Most Effective",
      description: "Users are 3.2x more likely to click on password reset emails than other campaign types.",
      type: "danger"
    },
    { 
      id: 2, 
      title: "Marketing Department Most Vulnerable",
      description: "Marketing team members have 28% click rate, significantly higher than company average of 18%.",
      type: "danger"
    },
    { 
      id: 3, 
      title: "Report Rate Improving",
      description: "Report rate increased from 24% to 36% over the last quarter, showing positive awareness trend.",
      type: "success"
    }
  ],
  recommendations: [
    "Schedule focused training for Marketing department on identifying phishing attempts",
    "Create specialized campaign targeting password reset awareness across all departments",
    "Implement company-wide awareness initiative around checking sender email addresses and URLs before clicking"
  ]
};

const ReportInsightsAnalyzer = () => {
  const handleDownloadReport = () => {
    toast({
      title: "Report downloading",
      description: "Your full analysis report is being prepared for download."
    });
    
    // In a real implementation, this would trigger a file download
  };

  const handleRunNewAnalysis = () => {
    toast({
      title: "Analysis started",
      description: "A new AI analysis of your campaign data has been initiated."
    });
    
    // In a real implementation, this would trigger a new analysis
  };

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-violet-500" />
          <CardTitle>AI Report Insights</CardTitle>
        </div>
        <CardDescription>Advanced analysis of your phishing campaign results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500 mb-1">Organization Risk Score</div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{mockInsights.summary.riskScore}</span>
                <span className="text-sm text-amber-600">/100</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${
                    mockInsights.summary.riskScore > 75 ? "bg-red-500" : 
                    mockInsights.summary.riskScore > 50 ? "bg-amber-500" : 
                    "bg-green-500"
                  }`} 
                  style={{ width: `${mockInsights.summary.riskScore}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500 mb-1">Analysis Overview</div>
              <ul className="text-sm space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Top Risk Factor:</span>
                  <span className="font-medium">{mockInsights.summary.topRiskFactor}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Improvement Rate:</span>
                  <span className="font-medium text-green-600">{mockInsights.summary.improvementRate}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Last Analysis:</span>
                  <span className="font-medium">{mockInsights.summary.analysisDate}</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Key Findings */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Key Findings
            </h3>
            <div className="space-y-3">
              {mockInsights.keyFindings.map((finding) => (
                <div key={finding.id} className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start gap-2">
                    {finding.type === "danger" ? (
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-medium ${finding.type === "danger" ? "text-red-700" : "text-green-700"}`}>
                        {finding.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recommendations */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-amber-500" /> 
              AI Recommendations
            </h3>
            <ul className="space-y-2">
              {mockInsights.recommendations.map((recommendation, index) => (
                <li key={index} className="flex gap-2">
                  <ArrowRight className="h-4 w-4 text-phish-600 shrink-0 mt-1" />
                  <span className="text-sm text-gray-600">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between border-t border-gray-100 pt-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-1"
          onClick={handleDownloadReport}
        >
          <Download className="h-4 w-4" /> 
          Download Full Report
        </Button>
        <Button 
          className="bg-phish-600 hover:bg-phish-700 flex items-center gap-1"
          onClick={handleRunNewAnalysis}
        >
          <Clock className="h-4 w-4" />
          Run New Analysis
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportInsightsAnalyzer;

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";

interface CertificatePreviewProps {
  courseName?: string;
  userName?: string;
  completionDate?: string;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  courseName = "Security Awareness Training",
  userName = "John Doe",
  completionDate = new Date().toLocaleDateString()
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Certificate Preview</h3>
      </div>

      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <div className="certificate bg-gradient-to-r from-blue-50 to-purple-50 p-8 text-center rounded-lg border border-gray-200">
            <div className="certificate-header border-b border-gray-200 pb-4 mb-4">
              <img 
                src="/lovable-uploads/876a553e-d478-4016-a8f0-1580f492ca19.png" 
                alt="CSWORD Logo" 
                className="h-12 mx-auto mb-2" 
              />
              <h2 className="text-xl font-bold text-gray-800">CSWORD</h2>
              <p className="text-gray-600 text-sm">Security Awareness Platform</p>
            </div>
            
            <div className="certificate-body py-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">CERTIFICATE OF COMPLETION</h1>
              <p className="text-gray-600 text-sm mb-6">This certifies that</p>
              
              <p className="text-xl font-bold text-blue-800 mb-6">{userName}</p>
              
              <p className="text-gray-600 text-sm mb-2">has successfully completed</p>
              <p className="text-lg font-semibold text-gray-800 mb-6">{courseName}</p>
              
              <p className="text-gray-600 text-sm">Completed on {completionDate}</p>
            </div>
            
            <div className="certificate-footer pt-4 mt-4 border-t border-gray-200">
              <div className="flex justify-center items-center gap-4">
                <div className="signature">
                  <div className="h-px w-24 bg-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-600">Director Signature</p>
                </div>
                
                <div className="seal flex items-center justify-center h-16 w-16 rounded-full border-2 border-gray-300">
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
                
                <div className="signature">
                  <div className="h-px w-24 bg-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-600">Date</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificatePreview;

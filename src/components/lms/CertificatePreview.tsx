import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";

interface CertificatePreviewProps {
  campaignName?: string;
  userName?: string;
  completionDate?: string;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  campaignName = "Security Awareness Training",
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
          <div className="relative w-full">
            <img src="/Certificate.png" alt="Certificate of Completion" className="w-full h-auto" />
            <div
              className="absolute w-full text-center"
              style={{ top: '48%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <p className="text-3xl font-semibold text-gray-800" style={{ fontFamily: "'Times New Roman', serif" }}>
                {userName}
              </p>
            </div>
            <div
              className="absolute w-full text-center"
              style={{ top: '60%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <p className="text-xl font-medium" style={{ fontFamily: "'Times New Roman', serif", color: '#8B4513',fontSize:12 }}>
              who have completed a {campaignName} program, indicating that they have
              </p>
            </div>
            <div
              className="absolute w-full text-center"
              style={{ top: '65%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <p className="text-xl font-medium" style={{ fontFamily: "'Times New Roman', serif", color: '#8B4513' , fontSize:12 }}>
              fulfilled a certain number of hours of service.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificatePreview;

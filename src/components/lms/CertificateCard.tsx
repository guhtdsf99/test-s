import React from 'react';
import { lmsService } from '@/services/api';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Eye } from "lucide-react";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import CertificatePreview from './CertificatePreview';

interface CertificateCardProps {
  id: string;
  title: string;
  userName: string;
  completionDate: Date;
  courseId?: string;
  department?: string;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  id,
  title,
  userName,
  completionDate,
  department = "Not Specified"
}) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      toast({ title: "Preparing download..." });

      const blob = await lmsService.downloadCertificate(id);

      // Create a temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Certificate download failed', error);
      toast({
        title: "Download Failed",
        description: "Unable to download certificate. Please try again later.",
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Issued To:</span>
            <span className="font-medium">{userName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Group:</span>
            <span className="font-medium">{department}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion Date:</span>
            <span className="font-medium">{format(completionDate, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Certificate ID:</span>
            <span className="font-medium text-xs">{id.substring(0, 8)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-3 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <CertificatePreview 
              courseName={title}
              userName={userName}
              completionDate={format(completionDate, 'MMMM d, yyyy')}
            />
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" size="sm" className="gap-1" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CertificateCard;

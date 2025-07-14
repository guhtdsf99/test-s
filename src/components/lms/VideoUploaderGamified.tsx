import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileVideo, Upload, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const VideoUploaderGamified = () => {
  const { toast } = useToast();
  const [videoName, setVideoName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !videoName || !targetAudience) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields and select a video file.',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Upload Started', description: 'Your video is being uploaded...' });
    // TODO: integrate real upload logic with backend
  };

  return (
    <Card className='security-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileVideo className='h-5 w-5 text-[#907527]' /> Upload Training Video
          <Shield className='h-4 w-4 text-csword-gold ml-auto' />
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='videoName'>Video Name</Label>
          <Input id='videoName' value={videoName} onChange={(e) => setVideoName(e.target.value)} placeholder='Enter video name' />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='targetAudience'>Target Audience</Label>
          <Input id='targetAudience' value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder='Enter target audience' />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='video'>Video File</Label>
          <div className='border-2 border-dashed border-gray-200 rounded-lg p-6 text-center'>
            <Input id='video' type='file' accept='video/*' className='hidden' onChange={handleFileChange} />
            <label htmlFor='video' className='cursor-pointer flex flex-col items-center gap-2'>
              <Upload className='h-8 w-8 text-gray-400' />
              <span className='text-sm text-gray-500'>{selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}</span>
            </label>
          </div>
        </div>
        <Button onClick={handleUpload} className='w-full bg-[#907527] hover:bg-[#705b1e] text-white'>
          <Upload className='mr-2 h-4 w-4' /> Upload Video
        </Button>
      </CardContent>
    </Card>
  );
};

export default VideoUploaderGamified;

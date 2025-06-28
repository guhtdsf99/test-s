import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Check, Clock, Video } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface Video {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  thumbnail: string;
  questions: Question[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  completed: boolean;
  certificateAvailable: boolean;
  videos: Video[];
}

interface CourseCardProps {
  course: Course;
  onStartVideo: (video: Video) => void;
  onDownloadCertificate?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  onStartVideo,
  onDownloadCertificate
}) => {
  const isCompleted = course.completed;
  
  if (isCompleted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{course.title}</CardTitle>
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Completed
            </div>
          </div>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-sm">Completed on: {new Date().toLocaleDateString()}</span>
            {course.certificateAvailable && onDownloadCertificate && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onDownloadCertificate}
              >
                <Award className="h-4 w-4" />
                Certificate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50">
        <CardTitle>{course.title}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm">{course.progress}%</span>
        </div>
        <Progress value={course.progress} className="h-2 mb-4" />
        
        <div className="text-sm text-muted-foreground mb-4 flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Due: {new Date(course.dueDate).toLocaleDateString()}
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Videos:</h4>
          {course.videos.map((video) => (
            <div key={video.id} className="flex justify-between items-center p-2 border rounded-md">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{video.title}</span>
                {video.completed && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onStartVideo(video)}
              >
                {video.completed ? 'Review' : 'Start'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

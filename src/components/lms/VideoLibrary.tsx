import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ExternalLink, FileVideo, Loader2, Play, RefreshCw, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import API_ENDPOINTS, { getAuthHeaders } from '@/config/api';

// Define the Course type
interface Course {
  id: number;
  name: string;
  type: string;
  description: string;
  video_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export const VideoLibrary = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title: string} | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const { toast } = useToast();
  useAuth(); // We only need this to ensure user is authenticated

  // Fetch courses from the API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Extract company slug from URL path
        const pathParts = window.location.pathname.split('/');
        const companySlug = pathParts.length > 1 && pathParts[1] && 
                          !['admin', 'api', 'static', 'media'].includes(pathParts[1])
                          ? pathParts[1] : undefined;
        
        const response = await fetch(
          API_ENDPOINTS.LIST_WITH_VIDEOS(companySlug),
          {
            method: 'GET',
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || 
            errorData.message || 
            `Failed to fetch courses: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        
        // Ensure we have an array of courses with required fields
        const formattedCourses = Array.isArray(data) 
          ? data.map((course: any) => ({
              id: course.id,
              name: course.name || `Course ${course.id}`,
              type: course.category || 'Uncategorized',
              description: course.description || '',
              video_url: course.video_url || course.video,
              thumbnail_url: course.thumbnail_url || course.thumbnail,
              created_at: course.created_at || new Date().toISOString(),
              updated_at: course.updated_at || new Date().toISOString()
            }))
          : [];
            
        setCourses(formattedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load courses. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [toast]);

  // Get unique categories from courses
  const categories = ['All', ...Array.from(new Set(courses.map(course => course.type)))];

  // Filter courses based on selected category
  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(course => course.type === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#907527]" />
        <span className="ml-2">Loading courses...</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileVideo className="h-5 w-5 text-[#907527]" />
          Video Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full max-w-xs">
            <Label htmlFor="category-filter" className="mb-2 block">Filter by Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="relative group overflow-hidden rounded-lg border hover:shadow-md transition-shadow">
                <div className="aspect-video relative overflow-hidden bg-gray-100 group">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.name} 
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FileVideo className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {course.video_url && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedVideo({ url: course.video_url!, title: course.name });
                      }}
                      className="absolute inset-0 m-auto w-12 h-12 bg-black/70 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Play video"
                    >
                      <Play className="h-6 w-6 ml-1" />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{course.name}</h3>
                  
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <FileVideo className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="text-gray-500">No courses are available for your company.</p>
            <p className="text-sm text-gray-400">Courses need to be assigned to your company by an administrator.</p>
          </div>
        )}
      </CardContent>
      
      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => {
        if (!open) {
          setSelectedVideo(null);
          setVideoError(null);
          setIsVideoLoading(false);
        }
      }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-lg font-semibold">{selectedVideo?.title}</DialogTitle>
          </div>
          
          <div className="aspect-video bg-black relative">
            {selectedVideo && (
              <>
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                )}
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center">
                    <div className="bg-red-500/20 p-4 rounded-full mb-4">
                      <X className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Error Loading Video</h3>
                    <p className="text-sm text-gray-300 mb-4">{videoError}</p>
                    <Button 
                      variant="outline" 
                      className="text-white border-white/30 hover:bg-white/10"
                      onClick={() => {
                        setVideoError(null);
                        setIsVideoLoading(true);
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                )}
                <video 
                  key={selectedVideo.url} // Force re-render on URL change
                  src={selectedVideo.url}
                  controls 
                  className="w-full h-full"
                  onCanPlay={() => {
                    setIsVideoLoading(false);
                    setVideoError(null);
                  }}
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    setIsVideoLoading(false);
                    setVideoError('Failed to load video. Please check your connection and try again.');
                  }}
                  onLoadStart={() => setIsVideoLoading(true)}
                  onLoadedData={() => setIsVideoLoading(false)}
                  playsInline
                />
              </>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedVideo?.url.includes('youtube') ? 'YouTube Video' : 'Video Player'}
            </p>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (selectedVideo) {
                    window.open(selectedVideo.url, '_blank');
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

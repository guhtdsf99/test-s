
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileVideo, Search, Plus, Upload, Edit, Check, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface VideoItem {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  authorizedCompanies: string[];
}

interface Company {
  id: string;
  name: string;
}

export const VideoManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  
  // Mock categories data
  const categories = ['All', 'Security', 'Awareness', 'Compliance', 'Development'];

  // Mock companies data
  const [companies] = useState<Company[]>([
    { id: '1', name: 'Acme Corp' },
    { id: '2', name: 'TechSolutions Inc.' },
    { id: '3', name: 'Global Enterprises' },
    { id: '4', name: 'New Startup' },
  ]);

  // Mock videos data
  const [videos, setVideos] = useState<VideoItem[]>([
    {
      id: 'v1',
      title: 'Security Basics Training',
      category: 'Security',
      thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      videoUrl: '/videos/security-basics.mp4',
      authorizedCompanies: ['1', '2']
    },
    {
      id: 'v2',
      title: 'Password Management',
      category: 'Security',
      thumbnail: 'https://images.unsplash.com/photo-1500673922987-e212871fec22',
      videoUrl: '/videos/password-management.mp4',
      authorizedCompanies: ['1', '2', '3']
    },
    {
      id: 'v3',
      title: 'Social Engineering Awareness',
      category: 'Awareness',
      thumbnail: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07',
      videoUrl: '/videos/social-engineering.mp4',
      authorizedCompanies: ['2']
    },
    {
      id: 'v4',
      title: 'Data Protection 101',
      category: 'Compliance',
      thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      videoUrl: '/videos/data-protection.mp4',
      authorizedCompanies: ['1', '3']
    },
    {
      id: 'v5',
      title: 'GDPR Training',
      category: 'Compliance',
      thumbnail: 'https://images.unsplash.com/photo-1500673922987-e212871fec22',
      videoUrl: '/videos/gdpr-training.mp4',
      authorizedCompanies: []
    },
    {
      id: 'v6',
      title: 'Secure Coding Practices',
      category: 'Development',
      thumbnail: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07',
      videoUrl: '/videos/secure-coding.mp4',
      authorizedCompanies: ['1', '2', '3', '4']
    }
  ]);

  // Create form validation schema
  const videoSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    authorizedCompanies: z.array(z.string()).optional(),
  });

  const form = useForm({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      category: '',
      authorizedCompanies: [],
    }
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedThumbnail(e.target.files[0]);
    }
  };

  // Filter videos based on search term and category
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditVideo = (video: VideoItem) => {
    setEditingVideo(video);
    form.reset({
      title: video.title,
      category: video.category,
      authorizedCompanies: video.authorizedCompanies,
    });
    setIsDialogOpen(true);
  };

  const handleAddNewVideo = () => {
    setEditingVideo(null);
    form.reset({
      title: '',
      category: '',
      authorizedCompanies: [],
    });
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingVideo) {
      // Update existing video
      const updatedVideos = videos.map(video => 
        video.id === editingVideo.id 
          ? { 
              ...video, 
              title: data.title,
              category: data.category,
              authorizedCompanies: data.authorizedCompanies || [],
              // If a new thumbnail was uploaded, we would update the URL here
              // In a real app, this would involve uploading the file to storage first
              thumbnail: selectedThumbnail ? URL.createObjectURL(selectedThumbnail) : video.thumbnail
            } 
          : video
      );
      
      setVideos(updatedVideos);
      
      toast({
        title: "Video updated",
        description: `${data.title} has been updated successfully.`,
      });
    } else {
      // Add new video
      if (!selectedFile) {
        toast({
          variant: "destructive",
          title: "Video file required",
          description: "Please upload a video file.",
        });
        return;
      }
      
      if (!selectedThumbnail) {
        toast({
          variant: "destructive",
          title: "Thumbnail required",
          description: "Please upload a thumbnail image.",
        });
        return;
      }

      // Create a new video entry
      const newVideo: VideoItem = {
        id: `v${videos.length + 1}`,
        title: data.title,
        category: data.category,
        // In a real app, we would upload the files to storage and get URLs back
        videoUrl: URL.createObjectURL(selectedFile),
        thumbnail: URL.createObjectURL(selectedThumbnail),
        authorizedCompanies: data.authorizedCompanies || [],
      };

      setVideos([...videos, newVideo]);
      
      toast({
        title: "Video added",
        description: `${data.title} has been added successfully.`,
      });
    }
    
    setIsDialogOpen(false);
    setSelectedFile(null);
    setSelectedThumbnail(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileVideo className="h-5 w-5 text-[#907527]" />
          Video Library Management
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNewVideo} className="bg-[#907527] hover:bg-[#705b1e]">
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Security Basics Training" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.filter(cat => cat !== 'All').map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editingVideo && (
                  <div className="space-y-2">
                    <Label htmlFor="video-file">Video File</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <Input
                        id="video-file"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="video-file"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {selectedFile 
                            ? selectedFile.name 
                            : "Click to upload video file or drag and drop"}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail Image</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailChange}
                    />
                    <label
                      htmlFor="thumbnail"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {selectedThumbnail 
                          ? selectedThumbnail.name 
                          : editingVideo
                            ? "Upload new thumbnail (optional)"
                            : "Click to upload thumbnail image or drag and drop"}
                      </span>
                    </label>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="authorizedCompanies"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Authorized Companies</FormLabel>
                      </div>
                      <div className="border rounded-md p-4 space-y-2">
                        {companies.map((company) => (
                          <div key={company.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`company-${company.id}`}
                              checked={(field.value || []).includes(company.id)}
                              onCheckedChange={(checked) => {
                                const updatedCompanies = checked
                                  ? [...(field.value || []), company.id]
                                  : (field.value || []).filter(id => id !== company.id);
                                field.onChange(updatedCompanies);
                              }}
                            />
                            <Label htmlFor={`company-${company.id}`}>{company.name}</Label>
                          </div>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">
                    {editingVideo ? 'Save Changes' : 'Add Video'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-full max-w-[200px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <div key={video.id} className="relative group overflow-hidden rounded-lg border hover:shadow-md transition-shadow">
              <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {video.authorizedCompanies.length > 0 ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">Authorized</Badge>
                  ) : (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white">Not Authorized</Badge>
                  )}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium truncate">{video.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline">{video.category}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditVideo(video)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {video.authorizedCompanies.length > 0 ? (
                    <span>{video.authorizedCompanies.length} companies authorized</span>
                  ) : (
                    <span>No companies authorized</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredVideos.length === 0 && (
          <div className="text-center py-10">
            <FileVideo className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium">No videos found</h3>
            <p className="text-gray-500">Try adjusting your search or filter.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

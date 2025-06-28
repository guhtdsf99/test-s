import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { lmsService, authService } from '@/services/api';
import { CourseCard } from "@/components/CourseCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Quiz } from "@/components/Quiz";
import MainLayout from '@/components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  RadioGroup, 
  RadioGroupItem 
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Award, 
  Check, 
  Clock, 
  Video, 
  BookOpen,
  PlayCircle
} from 'lucide-react';
import CertificateCard from '@/components/lms/CertificateCard';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: QuizOption[];
}

interface Video {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  thumbnail: string;
  videoUrl?: string;
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

interface CourseBase {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  video?: string;
  completed?: boolean;
  progress?: number;
  dueDate?: string;
  certificateAvailable?: boolean;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  completed: boolean;
  certificateAvailable: boolean;
  courses: CourseBase[];
  totalCourses: number;
  completedCourses: number;
}

interface Certificate {
  id: string;
  title: string;
  userName: string;
  completionDate: Date;
}

const EmployeeCourses = () => {
  const { toast } = useToast();
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: string}>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  const fetchUserCampaigns = async () => {
    try {
      setLoading(true);
      const campaignData = await lmsService.getUserCampaigns();
      
      if (campaignData && Array.isArray(campaignData) && campaignData.length > 0) {
        const transformedCampaigns: Campaign[] = campaignData.map((campaign: any) => ({
          id: campaign.id,
          title: campaign.title,
          description: campaign.description || "",
          dueDate: campaign.dueDate || 'No due date',
          progress: campaign.progress || 0,
          completed: campaign.completed || false,
          certificateAvailable: campaign.certificateAvailable || false,
          courses: campaign.courses?.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description || "",
            thumbnail: course.thumbnail || '/placeholder.svg',
            video: course.video || '',
            completed: course.completed || false
          })) || [],
          totalCourses: campaign.totalCourses || 0,
          completedCourses: campaign.completedCourses || 0
        }));
        
        setCampaigns(transformedCampaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('User does not belong to any company') || 
          errorMessage.includes('Company context required')) {
        toast({
          title: "Super Admin Notice",
          description: "Courses are only available for company users. Super admins don't have assigned courses.",
        });
      } else {
        console.error('Error fetching campaigns:', err);
        toast({
          title: "Error",
          description: "Failed to load campaigns. Please try again later.",
          variant: "destructive"
        });
      }
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await lmsService.getCertificates();
        const parsed: Certificate[] = (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          userName: c.userName,
          completionDate: c.completionDate ? new Date(c.completionDate) : new Date(),
        }));
        setCertificates(parsed);
      } catch (err) {
        console.error('Failed to load certificates', err);
        toast({
          title: 'Error',
          description: 'Failed to load certificates.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCertificates(false);
      }
    };

    fetchCertificates();
  }, []);

  // Fetch profile to know current user's full name
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authService.getProfile();
        const fullName = `${profile.first_name} ${profile.last_name}`.trim();
        setCurrentUserName(fullName);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch user's assigned campaigns on component mount
  useEffect(() => {
    fetchUserCampaigns();
  }, []);

  const handleMarkCourseAsCompleted = async () => {
    if (!activeCampaign || !activeVideo) return;

    try {
      await lmsService.markCourseCompleted(activeCampaign.id, activeVideo.id);
      toast({
        title: "Course Completed",
        description: `Successfully marked "${activeVideo.title}" as completed.`,
      });

      // Refetch campaigns to update the UI
      await fetchUserCampaigns();

      // Close the video dialog
      setActiveVideo(null);

    } catch (error) {
      console.error('Error marking course as completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark course as completed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartVideo = (campaign: Campaign, course: CourseBase) => {
    setActiveCampaign(campaign);
    setActiveCourse(null);
    setActiveVideo(null);
    setShowQuiz(false);
    setQuizCompleted(false);
    setVideoPlaying(false);
    
    // Create a video object from the course data
    const video: Video = {
      id: course.id,
      title: course.title,
      duration: '10:00', // Default duration if not provided by API
      completed: false,
      thumbnail: course.thumbnail || '/placeholder.svg',
      videoUrl: course.video,
      questions: [] // We'll need to fetch questions separately if needed
    };
    
    setActiveVideo(video);
  };
  
  const markVideoAsCompleted = () => {
    if (!activeVideo || !activeCampaign) return;
    
    // In a real app, this would save to the backend
    // For now, we just update the mock data
    const updatedCampaigns = campaigns.map(campaign => {
      if (campaign.id === activeCampaign.id) {
        const updatedCourses = campaign.courses.map(course => {
          if (course.id === activeVideo.id) {
            return { 
              ...course, 
              completed: true,
              progress: 100
            };
          }
          return course;
        });
        
        const completedCount = updatedCourses.filter(c => c.completed).length;
        const totalCourses = updatedCourses.length;
        const newProgress = Math.round((completedCount / totalCourses) * 100);
        const allCompleted = completedCount === totalCourses;
        
        const updatedCampaign = { 
          ...campaign, 
          courses: updatedCourses, 
          progress: newProgress,
          completed: allCompleted,
          certificateAvailable: allCompleted,
          completedCourses: completedCount,
          totalCourses: totalCourses
        };

        // Update active campaign with new data
        setActiveCampaign(updatedCampaign);
        
        return updatedCampaign;
      }
      return campaign;
    });
    
    setCampaigns(updatedCampaigns);
    
    // Update active campaign with new data
    const updatedCampaign = updatedCampaigns.find(c => c.id === activeCampaign.id);
    if (updatedCampaign) {
      setActiveCampaign(updatedCampaign);
    }
    
    toast({
      title: "Video Completed",
      description: "This video has been marked as completed.",
    });
  };
  
  const handleVideoComplete = () => {
    if (activeVideo) {
      // Check if the video has questions
      if (activeVideo.questions && activeVideo.questions.length > 0) {
        // After video is complete, show quiz if available
        setShowQuiz(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuizCompleted(false);
      } else {
        // If no questions, mark the video as completed immediately
        markVideoAsCompleted();
        toast({
          title: "Video Completed",
          description: "You've successfully completed this video.",
        });
      }
    }
  };
  
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };
  
  const handleNextQuestion = () => {
    const currentQuestion = activeVideo?.questions[currentQuestionIndex];
    if (!currentQuestion || !selectedAnswers[currentQuestion.id]) {
      toast({
        title: "Please select an answer",
        description: "You must select an answer to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentQuestionIndex < (activeVideo?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      calculateScore();
    }
  };
  
  const calculateScore = () => {
    if (!activeVideo) return;
    
    let correct = 0;
    activeVideo.questions.forEach(question => {
      const selectedAnswerId = selectedAnswers[question.id];
      const correctOption = question.options.find(option => option.isCorrect);
      
      if (selectedAnswerId && correctOption && selectedAnswerId === correctOption.id) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / activeVideo.questions.length) * 100);
    setScore(percentage);
    setQuizCompleted(true);
    
    if (percentage >= 70) {
      // Pass threshold
      markVideoAsCompleted();
      toast({
        title: "Quiz Completed",
        description: `You scored ${percentage}% and passed the quiz!`,
      });
    } else {
      toast({
        title: "Quiz Failed",
        description: `You scored ${percentage}%. 70% is required to pass.`,
        variant: "destructive",
      });
    }
  };
  
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
  };
  
  const downloadCertificate = (campaignId: string) => {
    toast({
      title: "Certificate Downloaded",
      description: "Your certificate has been downloaded successfully.",
    });
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-200">My Training Courses</h1>
        
        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Courses</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="certificates">My Certificates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <div className="space-y-6">
              {campaigns.filter(campaign => !campaign.completed).map(campaign => (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                    <div className="pt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Progress</span>
                        <span className="text-sm font-bold text-primary">{campaign.progress}%</span>
                      </div>
                      <Progress value={campaign.progress} />
                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>{campaign.completedCourses} of {campaign.totalCourses} courses completed</span>
                        <span>Due: {campaign.dueDate === 'No due date' ? 'N/A' : new Date(campaign.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-md font-semibold mb-3">Courses</h3>
                    <ul className="space-y-3">
                      {campaign.courses.map(course => (
                        <li key={course.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                          <div className="flex items-center">
                            {course.completed ? (
                              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            ) : (
                              <Video className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${course.completed ? 'line-through text-muted-foreground' : ''}`}>{course.title}</span>
                          </div>
                          {!course.completed && (
                            <Button variant="outline" size="sm" onClick={() => handleStartVideo(campaign, course)}>
                              Start
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
              {campaigns.filter(campaign => !campaign.completed).length === 0 && (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-800">No Active Courses</h3>
                  <p className="text-muted-foreground">You don't have any active courses at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <div className="space-y-6">
              {campaigns.filter(campaign => campaign.completed).map(campaign => (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardHeader className="bg-green-50/50">
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                    <div className="pt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Progress</span>
                        <span className="text-sm font-bold text-green-600">
                          {campaign.progress}%
                        </span>
                      </div>
                      <Progress
                        value={campaign.progress}
                        className={campaign.progress === 100 ? "[&>div]:bg-green-500" : ""}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-md font-semibold mb-3">Courses</h3>
                    <ul className="space-y-3">
                      {campaign.courses.map(course => (
                        <li
                          key={course.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50"
                        >
                          <div className="flex items-center">
                            {course.completed ? (
                              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            ) : (
                              <Video className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm ${course.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {course.title}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
              {campaigns.filter(campaign => campaign.completed).length === 0 && (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Check className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium">No Completed Courses</h3>
                  <p className="text-muted-foreground">You haven't completed any courses yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="certificates">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-800">My Certificates</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingCertificates ? (
                  <p>Loading certificates...</p>
                ) : certificates.filter(cert => cert.userName === currentUserName).length === 0 ? (
                  <p>No certificates found.</p>
                ) : (
                  certificates
                    .filter(cert => cert.userName === currentUserName)
                    .map(cert => (
                      <CertificateCard
                        key={cert.id}
                        id={cert.id}
                        title={cert.title}
                        userName={cert.userName}
                        completionDate={cert.completionDate}
                      />
                    ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Video Player Dialog */}
      <Dialog open={!!activeVideo && !showQuiz} onOpenChange={(open) => {
        if (!open) {
          setActiveVideo(null);
          setVideoPlaying(false);
        }
      }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{activeVideo?.title}</DialogTitle>
          </DialogHeader>
          
          {activeVideo && (
            <div>
              {!videoPlaying ? (
                <div className="relative cursor-pointer group aspect-video" onClick={() => setVideoPlaying(true)}>
                  <img src={activeVideo.thumbnail} alt={activeVideo.title} className="w-full h-full object-cover rounded-md" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-300">
                    <PlayCircle className="w-20 h-20 text-white opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              ) : (
                <VideoPlayer 
                  title={activeVideo.title}
                  thumbnail={activeVideo.thumbnail}
                  onComplete={handleMarkCourseAsCompleted}
                  videoUrl={activeVideo.videoUrl}
                  autoplay
                />
              )}
            </div>
          )}
          <DialogFooter className="sm:justify-between">
              <Button onClick={handleMarkCourseAsCompleted}>
                <Check className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      {activeVideo && showQuiz && (
        <Dialog open={showQuiz} onOpenChange={(open) => {
          if (!open) {
            setShowQuiz(false);
            setQuizCompleted(false);
          }
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quiz for {activeVideo.title}</DialogTitle>
            </DialogHeader>
            
            {!quizCompleted ? (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Question {currentQuestionIndex + 1} of {activeVideo.questions.length}</CardTitle>
                    <CardDescription>{activeVideo.questions[currentQuestionIndex].text}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={selectedAnswers[activeVideo.questions[currentQuestionIndex].id]} 
                      onValueChange={(value) => handleAnswerSelect(activeVideo.questions[currentQuestionIndex].id, value)}
                    >
                      {activeVideo.questions[currentQuestionIndex].options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id}>{option.text}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
                <DialogFooter className="mt-4">
                  <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex < activeVideo.questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="text-center">
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg mb-2">You scored: {score}%</p>
                    {score >= 70 ? (
                      <p className="text-green-600">Congratulations, you passed!</p>
                    ) : (
                      <p className="text-red-600">Unfortunately, you did not pass. Please try again.</p>
                    )}
                  </CardContent>
                  <CardFooter className="justify-center">
                    {score < 70 && (
                      <Button onClick={restartQuiz}>Restart Quiz</Button>
                    )}
                    <Button variant="secondary" onClick={() => {
                      setShowQuiz(false);
                      setQuizCompleted(false);
                    }}>Close</Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
};

export default EmployeeCourses;

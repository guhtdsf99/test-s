import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface TopVideo {
  title: string;
  views: number;
  completion: number; // percentage value (0-100)
}

interface CampaignCourseCount {
  campaign_id: string;
  campaign_name: string;
  courses_count: number;
}

interface LMSOverview {
  campaign_course_counts: CampaignCourseCount[];
  total_views: number;
  average_completion: number; // percentage
  top_videos: TopVideo[];
}

interface Props {
  timeRange: string;
}

const LMSAnalytics: React.FC<Props> = ({ timeRange }) => {
  const [overview, setOverview] = useState<LMSOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_ENDPOINTS.LMS_ANALYTICS_OVERVIEW}?range=${timeRange}`, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setOverview(data);
      } catch (err: any) {
        console.error('Failed to fetch LMS analytics overview', err);
        setError('Failed to fetch LMS analytics overview');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [timeRange]);

  if (loading) {
    return <p>Loading LMS analytics...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (!overview) {
    return <p>No LMS analytics available.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            <CardTitle>LMS Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Number of Videos</p>
              {overview.campaign_course_counts.length === 0 ? (
                <p className="text-sm text-gray-600">No campaigns</p>
              ) : (
                <p className="text-2xl font-bold text-purple-900">
                  {overview.campaign_course_counts.reduce((sum, c) => sum + c.courses_count, 0)}
                </p>
              )}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Total Views</p>
              <p className="text-2xl font-bold text-blue-900">{overview.total_views}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Average Completion</p>
              <p className="text-2xl font-bold text-green-900">{overview.average_completion.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.top_videos.length === 0 ? (
            <p>No video performance data available.</p>
          ) : (
            <div className="space-y-4">
              {overview.top_videos.map((video, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{video.title}</p>
                    <p className="text-sm text-gray-600">{video.views} views</p>
                  </div>
                  <div className="text-green-600 font-medium">
                    {video.completion.toFixed(2)}% views
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LMSAnalytics;

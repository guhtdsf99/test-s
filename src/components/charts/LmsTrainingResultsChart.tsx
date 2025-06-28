import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface LmsCampaign {
  id: number;
  course_name: string;
}

interface LmsCampaignUser {
  lms_campaign_id: number;
  completed_at: string | null;
  started_at: string | null;
}

interface ChartData {
  campaign: string;
  completed: number;
  inProgress: number;
  notStarted: number;
}

const LmsTrainingResultsChart = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS.LMS_ANALYTICS_TRAINING_RESULTS, { 
          headers: getAuthHeaders() 
        });
        if (!res.ok) throw new Error('Failed to fetch training results');
        const chartData: ChartData[] = await res.json();
        setData(chartData);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" allowDecimals={false} domain={[0, 'dataMax']} />
          <YAxis dataKey="campaign" type="category" stroke="#6b7280" width={120} />
          <Tooltip 
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                completed: 'Completed',
                inProgress: 'In Progress', 
                notStarted: 'Not Started'
              };
              return [value, labels[name] || name];
            }}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
          <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          <Bar dataKey="notStarted" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LmsTrainingResultsChart;

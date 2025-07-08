import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Eye, ShieldCheck } from 'lucide-react';
import { lmsService, QuickInsightsData } from '@/services/api';

const QuickInsights: React.FC = () => {
  const [data, setData] = useState<QuickInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuickInsights = async () => {
      try {
        const response = await lmsService.getQuickInsights();
        setData(response);
      } catch (err) {
        setError('Failed to load quick insights.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickInsights();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Quick Insights</h2>
      <div className="flex flex-col gap-4">
        <Card className="p-4 flex items-center justify-between dark:bg-gray-700">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-green-500" />
            <span className="font-semibold dark:text-gray-200">Reporting Rate</span>
          </div>
          <span className={`font-bold text-lg ${data.reporting_rate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.reporting_rate > 0 ? '+' : ''}{data.reporting_rate}%
          </span>
        </Card>
        <Card className="p-4 flex items-center justify-between dark:bg-gray-700">
          <div className="flex items-center">
            <Eye className="w-6 h-6 mr-3 text-blue-500" />
            <span className="font-semibold dark:text-gray-200">Security Awareness</span>
          </div>
          <span className="font-bold text-lg text-blue-500">{data.security_awareness}%</span>
        </Card>
        <Card className="p-4 flex items-center justify-between dark:bg-gray-700">
          <div className="flex items-center">
            <ShieldCheck className="w-6 h-6 mr-3 text-yellow-500" />
            <span className="font-semibold dark:text-gray-200">Policy Adherence</span>
          </div>
          <span className="font-bold text-lg text-yellow-500">{data.policy_adherence}%</span>
        </Card>
      </div>
    </section>
  );
};

export default QuickInsights;

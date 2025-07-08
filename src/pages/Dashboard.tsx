import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar
} from 'recharts';
import { PlusCircle, Mail, AlertCircle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import Video from '@/components/Video';
import LmsTrainingResultsChart from '@/components/charts/LmsTrainingResultsChart';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import QuickInsights from '@/components/lms/QuickInsights';

// Interfaces for fetched analytics data
interface SummaryStats {
  total_campaigns: number;
  total_emails_sent: number;
  total_emails_clicked: number;
  total_emails_read: number;
  average_click_rate: number;
  average_read_rate: number;
}

interface TemporalTrendPoint {
  period: string;
  click_rate: number;
  read_rate: number;
  top_click_rate_department: { name: string; rate: number };
  top_read_rate_department: { name: string; rate: number };
}

interface LMSOverviewDashboard {
  campaigns_count: number;
  enrolled_users: number;
  average_completion: number;
}

interface DepartmentPerformance {
  department_id: string | null;
  department_name: string;
  emails_sent: number;
  emails_clicked: number;
  emails_read: number;
  click_rate: number;
  read_rate: number;
}

// Mock campaign data
const campaigns = [
  { 
    id: 1, 
    name: 'Password Reset Campaign', 
    status: 'Active',
    sentDate: '2025-04-10',
    targets: 85,
    clicks: 17,
    reads: 8
  },
  { 
    id: 2, 
    name: 'Bonus Announcement', 
    status: 'Completed',
    sentDate: '2025-04-02',
    targets: 120,
    clicks: 36,
    reads: 12
  },
  { 
    id: 3, 
    name: 'IT Security Update', 
    status: 'Draft',
    sentDate: '-',
    targets: 0,
    clicks: 0,
    reads: 0
  }
];

const Dashboard = () => {
  const { companySlug } = useParams<{ companySlug?: string }>();
  const lmsCampaignsLink = companySlug ? `/${companySlug}/lms-campaigns` : '/lms-campaigns';

  const [activeTab, setActiveTab] = useState('phishing');

  const [lmsStats, setLmsStats] = useState<LMSOverviewDashboard | null>(null);
  const [lmsError, setLmsError] = useState<string | null>(null);

  // --- Phishing analytics state ---
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);

  const [temporalTrend, setTemporalTrend] = useState<TemporalTrendPoint[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [errorTrend, setErrorTrend] = useState<string | null>(null);

  const [trendRange, setTrendRange] = useState<'monthly' | 'weekly'>('monthly');

  // --- Department performance state ---
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance[]>([]);
  const [filteredDepartmentPerformance, setFilteredDepartmentPerformance] = useState<DepartmentPerformance[]>([]);
  const [loadingDept, setLoadingDept] = useState(true);
  const [errorDept, setErrorDept] = useState<string | null>(null);

  const [mostVulnerableDept, setMostVulnerableDept] = useState<DepartmentPerformance | null>(null);
  const [mostEffectiveDept, setMostEffectiveDept] = useState<DepartmentPerformance | null>(null);

  useEffect(() => {
    const fetchLmsStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.LMS_ANALYTICS_OVERVIEW, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const data = await res.json();
        setLmsStats({
          campaigns_count: data.campaigns_count ?? 0,
          enrolled_users: data.enrolled_users ?? 0,
          average_completion: data.average_completion ?? 0,
        });
      } catch (err) {
        console.error('Failed fetch LMS stats', err);
        setLmsError('Failed to load');
      }
    };

    // fetch once on mount
    fetchLmsStats();
  }, []);

  // Fetch phishing analytics once on mount
  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const res = await fetch(API_ENDPOINTS.ANALYTICS_SUMMARY, {
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        setSummaryStats(await res.json());
      } catch (err) {
        console.error('Failed to fetch summary stats', err);
        setErrorSummary('Failed to load');
      } finally {
        setLoadingSummary(false);
      }
    };

    const fetchTrend = async () => {
      setLoadingTrend(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.ANALYTICS_TREND}?range=${trendRange}`, {
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        setTemporalTrend(await res.json());
      } catch (err) {
        console.error('Failed to fetch temporal trend', err);
        setErrorTrend('Failed to load');
      } finally {
        setLoadingTrend(false);
      }
    };

    const fetchDeptPerf = async () => {
      setLoadingDept(true);
      try {
        const res = await fetch(API_ENDPOINTS.ANALYTICS_DEPARTMENT, {
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        setDepartmentPerformance(await res.json());
      } catch (err) {
        console.error('Failed to fetch department data', err);
        setErrorDept('Failed to load');
      } finally {
        setLoadingDept(false);
      }
    };

    fetchSummary();
    fetchTrend();
    fetchDeptPerf();
  }, [trendRange]);

  useEffect(() => {
    if (departmentPerformance && departmentPerformance.length > 0) {
      const actualDepartments = departmentPerformance.filter(
        (dept) => dept.department_id !== null
      );
      setFilteredDepartmentPerformance(actualDepartments);

      if (actualDepartments.length > 0) {
        setMostVulnerableDept(
          actualDepartments.reduce((prev, current) => 
            (prev.click_rate > current.click_rate) ? prev : current
          )
        );
        setMostEffectiveDept(
          actualDepartments.reduce((prev, current) => 
            (prev.click_rate < current.click_rate) ? prev : current
          )
        );
      } else {
        setMostVulnerableDept(null);
        setMostEffectiveDept(null);
      }
    } else {
      setMostVulnerableDept(null);
      setMostEffectiveDept(null);
    }
  }, [departmentPerformance]);

  return (
    <MainLayout>
      <div className="flex-grow bg-gray-0 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col mb-5">
          <div className="bg-gradient-to-r from-[#6a4548] to-[#3d292a] rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Security Dashboard Overview</h2>
        <p className="text-[#d1b8b9]">Monitor your organization's cybersecurity awareness and threat readiness</p>
      </div>
          </div>

          <Tabs defaultValue="phishing" className="space-y-4">
            <TabsList>
              <TabsTrigger value="phishing">Phishing Campaigns</TabsTrigger>
              <TabsTrigger value="lms">LMS Campaign</TabsTrigger>
            </TabsList>

            <TabsContent value="phishing" className="space-y-4">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
                        <p className="text-3xl font-bold">
                          {loadingSummary ? '...' : summaryStats ? summaryStats.total_campaigns : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-phish-50 p-3 rounded-lg">
                        <Mail className="h-5 w-5 text-phish-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>Up 10% from last month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Average Click Rate</p>
                        <p className="text-3xl font-bold">
                          {loadingSummary ? '...' : summaryStats ? `${summaryStats.average_click_rate.toFixed(2)}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-red-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>Up 3% from last month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Average Reporting Rate</p>
                        <p className="text-3xl font-bold">
                          {loadingSummary ? '...' : summaryStats ? `${summaryStats.average_read_rate.toFixed(2)}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>Up 12% from last month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Emails Sent</p>
                        <p className="text-3xl font-bold">
                          {loadingSummary ? '...' : summaryStats ? summaryStats.total_emails_sent : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-blue-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>Added 15 new this month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-500">Most Vulnerable Group.</p>
                    </div>
                    {loadingDept ? <p>Loading...</p> : errorDept ? <p className="text-red-500 text-xs">Error: {errorDept}</p> : mostVulnerableDept ? (
                      <>
                        <h2 className="text-2xl font-bold text-red-600">{mostVulnerableDept.department_name}</h2>
                        <p className="text-xs text-gray-500">
                          {mostVulnerableDept.click_rate.toFixed(2)}% Click Rate
                        </p>
                      </>
                    ) : <p className="text-sm text-gray-500">N/A</p>}
                  </CardContent>
                </Card>

                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-500">Most Effective Group.</p>
                    </div>
                    {loadingDept ? <p>Loading...</p> : errorDept ? <p className="text-red-500 text-xs">Error: {errorDept}</p> : mostEffectiveDept ? (
                      <>
                        <h2 className="text-2xl font-bold text-green-600">{mostEffectiveDept.department_name}</h2>
                        <p className="text-xs text-gray-500">
                          {mostEffectiveDept.click_rate.toFixed(2)}% Click Rate
                        </p>
                      </>
                    ) : <p className="text-sm text-gray-500">N/A</p>}
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-gray-100">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Phishing Awareness Trend</CardTitle>
                      <div className="flex items-center rounded-lg bg-gray-100 p-1">
                        <Button
                            variant={trendRange === 'monthly' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setTrendRange('monthly')}
                            className={`px-3 py-1 text-xs h-auto ${trendRange === 'monthly' ? 'bg-white shadow' : ''}`}>
                            Monthly
                        </Button>
                        <Button
                            variant={trendRange === 'weekly' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setTrendRange('weekly')}
                            className={`px-3 py-1 text-xs h-auto ${trendRange === 'weekly' ? 'bg-white shadow' : ''}`}>
                            Weekly
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={temporalTrend}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis unit="%" domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="click_rate"
                            name="Click Rate (%)"
                            stroke="#ef4444"
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="read_rate"
                            name="Reporting Rate (%)"
                            stroke="#10b981"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100">
                  <CardHeader>
                    <CardTitle>Group Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {loadingTrend ? (
                        <p>Loading group data...</p>
                      ) : errorTrend ? (
                        <p className="text-red-500 text-xs">Error: {errorTrend}</p>
                      ) : temporalTrend.length === 0 ? (
                        <p>No group data available.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={temporalTrend}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                            <XAxis 
                              dataKey="period" 
                              angle={-15} 
                              textAnchor="end" 
                              height={50} 
                              interval={0} 
                            />
                            <YAxis unit="%" domain={[0, 100]} />
                            <Tooltip formatter={(value: number, name: string, props: any) => {
                              if (name === 'Highest Click Rate') {
                                return [`${value}% - ${props.payload.top_click_rate_department.name}`, "Highest Click Rate"];
                              }
                              if (name === 'Highest Report Rate') {
                                return [`${value}% - ${props.payload.top_read_rate_department.name}`, "Highest report Rate"];
                              }
                              return [value, name];
                            }} />
                            <Legend />
                            <Bar dataKey="top_click_rate_department.rate" name="Highest Click Rate" fill="#ef4444" />
                            <Bar dataKey="top_read_rate_department.rate" name="Highest Report Rate" fill="#22C55E" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
            </TabsContent>

            <TabsContent value="lms" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                        <p className="text-3xl font-bold">
                          {lmsStats ? lmsStats.campaigns_count : lmsError || '...'}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <Video className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Enrolled Users</p>
                        <p className="text-3xl font-bold">
                          {lmsStats ? lmsStats.enrolled_users : lmsError || '...'}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                        <p className="text-3xl font-bold">
                          {lmsStats ? `${lmsStats.average_completion.toFixed(2)}%` : lmsError || '...'}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button asChild className="h-full bg-phish-50 hover:bg-phish-100 text-phish-600">
                  <Link to={lmsCampaignsLink} className="flex flex-col items-center justify-center gap-2">
                    <Video className="h-6 w-6" />
                    <span>View All Courses</span>
                  </Link>
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>LMS Training Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <LmsTrainingResultsChart />
                </CardContent>
              </Card>
              <QuickInsights />

            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

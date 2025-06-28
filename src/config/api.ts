// API configuration

// Base URLs for different environments
const getBaseUrl = () => {
  // Use Vite's environment variable for the backend URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback for development
  return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  // Campaign endpoints
  CAMPAIGNS: `${API_BASE_URL}/api/campaigns/`,
  CREATE_CAMPAIGN: `${API_BASE_URL}/api/campaigns/create/`,
  
  // Analytics endpoints
  ANALYTICS_SUMMARY: `${API_BASE_URL}/api/email/analytics/summary/`,
  ANALYTICS_DEPARTMENT: `${API_BASE_URL}/api/email/analytics/department-performance/`,
  ANALYTICS_TREND: `${API_BASE_URL}/api/email/analytics/temporal-trend/`,
  
  // LMS Analytics endpoints
  LMS_ANALYTICS_OVERVIEW: `${API_BASE_URL}/api/lms/analytics/overview/`,
  LMS_ANALYTICS_TRAINING_RESULTS: `${API_BASE_URL}/api/lms/analytics/training-results/`,
  // Certificates endpoint
  LMS_CERTIFICATES: `${API_BASE_URL}/api/lms/certificates/`,
  
  // Course endpoints
  COURSES: `${API_BASE_URL}/api/courses/courses/`,
  LIST_WITH_VIDEOS: (companySlug?: string) => 
    companySlug 
      ? `${API_BASE_URL}/api/courses/courses/list_with_videos/?company_slug=${companySlug}`
      : `${API_BASE_URL}/api/courses/courses/list_with_videos/`,
  
  // User endpoints
  USERS: `${API_BASE_URL}/api/users/`,
  
  // Email template endpoints
  EMAIL_TEMPLATES: `${API_BASE_URL}/api/email/templates/`,
  EMAIL_TEMPLATES_CREATE: `${API_BASE_URL}/api/email/templates/create/`,
} as const;

// Helper function to get authorization headers
export const getAuthHeaders = () => {
  // Check multiple possible token locations
  const token = 
    localStorage.getItem('access_token') || 
    localStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('token');
    
  if (!token) {
    console.warn('No access token found in storage');
    return { 'Content-Type': 'application/json' };
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export default API_ENDPOINTS;

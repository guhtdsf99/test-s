// API service for communicating with the Django backend

// For production, always use the backend URL
const isProduction = window.location.hostname.includes('railway.app');

// Use the hardcoded production URL if we're in production, otherwise use the environment variable or localhost
const API_URL = isProduction
  ? 'https://adventurous-magic-production.up.railway.app/api'
  : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://127.0.0.1:8000/api');

// Get company slug from URL path (e.g., /company-name/dashboard)
const getCompanySlug = (): string | null => {
  // Special case: if we're on the unauthorized route, don't treat it as a company
  if (window.location.pathname.startsWith('/unauthorized')) {
    return localStorage.getItem('companySlug');
  }
  
  const path = window.location.pathname;
  const parts = path.split('/');
  
  // List of known routes that are not company slugs
  const knownRoutes = [
    'login', 'register', 'dashboard', 'templates', 'campaigns',
    'analytics', 'users', 'profile', 'admin', '',
    'reset-password', 'super-admin', 'lms-campaigns', 'user-management',
    'employee-courses', 'profile-settings', 'unauthorized'
  ];
  
  // Check if path has at least one segment and it's not a known route
  if (parts.length > 1 && parts[1]) {
    // First check if we have a stored company slug that matches the current URL
    const storedCompanySlug = localStorage.getItem('companySlug');
    
    // If the URL path is a known system route, use the stored company slug
    if (knownRoutes.includes(parts[1])) {
      return storedCompanySlug;
    }
    
    // If the URL path matches our stored company slug, use it
    if (storedCompanySlug && path.startsWith(`/${storedCompanySlug}`)) {
      return storedCompanySlug;
    }
    
    // Check if the first segment is a company slug (not a known route)
    if (!knownRoutes.includes(parts[1])) {
      // Store the company slug for future reference
      localStorage.setItem('companySlug', parts[1]);
      return parts[1];
    }
  }
  
  // If not found in URL, try to get from localStorage
  return localStorage.getItem('companySlug');
};

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active?: boolean;
  departments?: string[];          // list of department IDs
  department_names?: string[];    // names from backend
  company?: Company;
}

export interface Department {
  id: string;
  name: string;
  user_count: number;
}

export interface Campaign {
  id: number;
  campaign_name: string;
  start_date: string;
  end_date: string;
  company: number;
  created_at: string;
  updated_at: string;
  targets_count?: number;
  clicks_count?: number;
  opens_count?: number;
  click_rate?: number;
  open_rate?: number;
}

export interface NewUserData {
  first_name: string;
  last_name: string;
  email: string;
  departments: string[];   // array of IDs as strings
  role: string;
}

export interface BulkUploadResponse {
  created_users: User[];
  errors: string[];
  total_created: number;
  total_errors: number;
}

export interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
  description: string;
  number_of_allowed_users: number;
  company_logo: string | null;
  color_palette: string;
  country: string;
  created_at: string;
  updated_at: string;
  current_user_count?: number; // Added for frontend use
}

export interface QuickInsightsData {
  reporting_rate: number;
  security_awareness: number;
  policy_adherence: number;
}

export const companyService = {
  getCompanies: async (): Promise<Company[]> => {
    try {
      const response = await fetch(`${API_URL}/auth/companies/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }
};

// Check if the current user is a Super Admin based on stored token data
const isSuperAdmin = (): boolean => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // JWT tokens are in the format header.payload.signature
    // We need to decode the payload (second part)
    const payload = token.split('.')[1];
    if (!payload) return false;
    
    // Decode the base64 payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check if the user role is super_admin
    return decodedPayload.role?.toLowerCase() === 'super_admin' || 
           decodedPayload.role?.toLowerCase() === 'superadmin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Use company-specific endpoint if available
      const endpoint = companySlug 
        ? `${API_URL}/auth/${companySlug}/token/`
        : `${API_URL}/auth/token/`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Handle non-JSON responses (like 500 errors that return HTML)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response:', await response.text());
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      // Store the token in localStorage
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      // Make sure we always throw an Error object with a message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(error?.toString() || 'Login failed');
      }
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Don't remove companySlug to maintain company context after logout
  },

  getProfile: async (): Promise<User> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      // For Super Admins, always use the company-specific endpoint if a company slug is available
      // This allows them to access any company's data
      let endpoint;
      
      if (superAdmin && companySlug) {
        // Super Admin accessing a specific company
        endpoint = `${API_URL}/auth/${companySlug}/profile/`;
        
        // Store this company slug for future API calls
        localStorage.setItem('companySlug', companySlug);
      } else if (companySlug) {
        // Regular user in a company context
        endpoint = `${API_URL}/auth/${companySlug}/profile/`;
      } else {
        // No company context
        endpoint = `${API_URL}/auth/profile/`;
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Add a header to indicate Super Admin status for backend processing if needed
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Use company-specific endpoint if available
      const endpoint = companySlug 
        ? `${API_URL}/auth/${companySlug}/token/refresh/`
        : `${API_URL}/auth/token/refresh/`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access);
      
      return data.access;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  updateProfile: async (userData: { first_name?: string; last_name?: string; email?: string }): Promise<User> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      // For Super Admins, always use the company-specific endpoint if a company slug is available
      let endpoint;
      
      if (superAdmin && companySlug) {
        // Super Admin accessing a specific company
        endpoint = `${API_URL}/auth/${companySlug}/profile/`;
        
        // Store this company slug for future API calls
        localStorage.setItem('companySlug', companySlug);
      } else if (companySlug) {
        // Regular user in a company context
        endpoint = `${API_URL}/auth/${companySlug}/profile/`;
      } else {
        // No company context
        endpoint = `${API_URL}/auth/profile/`;
      }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Add a header to indicate Super Admin status for backend processing if needed
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Use the dedicated change-password endpoint
      const endpoint = companySlug 
        ? `${API_URL}/auth/${companySlug}/change-password/`
        : `${API_URL}/auth/change-password/`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      // Handle non-JSON responses
      if (!response.ok) {
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to change password');
          } else {
            throw new Error(`Failed to change password: Server returned ${response.status} ${response.statusText}`);
          }
        } catch (parseError) {
          throw new Error(`Failed to change password: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    const endpoint = `${API_URL}/auth/password-reset/`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to request password reset. Please check the email and try again.');
    }
  },
};

// User management service
// Get company information including user limits
export const companyInfoService = {
  // Get company information including user count and limits
  getCompanyInfo: async (): Promise<CompanyInfo> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const companySlug = getCompanySlug();
      const superAdmin = isSuperAdmin();
      
      if (!companySlug) {
        throw new Error('Company context is required to fetch company information');
      }
      
      // Use the company endpoint to get company details
      const endpoint = `${API_URL}/auth/${companySlug}/company-info/`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company information');
      }

      // Get the company info
      const companyInfo = await response.json();
      
      // Get the user count in a separate request
      const usersResponse = await fetch(`${API_URL}/auth/${companySlug}/users/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        // Add the current user count to the company info
        companyInfo.current_user_count = users.length;
      }
      
      return companyInfo;
    } catch (error) {
      console.error('Get company info error:', error);
      throw error;
    }
  }
};

export const userService = {
  // Get all users for a company
  getUsers: async (): Promise<User[]> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      // For Super Admins, always use the company-specific endpoint if a company slug is available
      let endpoint;
      
      if (superAdmin && companySlug) {
        // Super Admin accessing a specific company
        endpoint = `${API_URL}/auth/${companySlug}/users/`;
      } else if (companySlug) {
        // Regular user in a company context
        endpoint = `${API_URL}/auth/${companySlug}/users/`;
      } else {
        // No company context
        throw new Error('Company context is required to fetch users');
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },
  
  // Update user status (active/inactive)
  updateUserStatus: async (userId: string, isActive: boolean): Promise<User> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      // For Super Admins, always use the company-specific endpoint if a company slug is available
      let endpoint;
      
      if (superAdmin && companySlug) {
        // Super Admin accessing a specific company
        endpoint = `${API_URL}/auth/${companySlug}/users/${userId}/`;
      } else if (companySlug) {
        // Regular user in a company context
        endpoint = `${API_URL}/auth/${companySlug}/users/${userId}/`;
      } else {
        // No company context
        throw new Error('Company context is required to update user status');
      }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user status');
      }

      return await response.json();
    } catch (error) {
      console.error('Update user status error:', error);
      throw error;
    }
  },

  // Add a new user
  addUser: async (userData: NewUserData): Promise<User> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      let endpoint;
      
      if (companySlug) {
        endpoint = `${API_URL}/auth/${companySlug}/users/`;
      } else {
        throw new Error('Company context is required to add a user');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
        body: JSON.stringify({ ...userData, departments: userData.departments.map(String) }),
      });

      // Handle non-JSON responses (like 500 errors that return HTML)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Add user response not OK:', response.status, response.statusText);
        throw new Error(data.detail || 'Failed to add user');
      }

      return data;
    } catch (error) {
      console.error('Add user error:', error);
      throw error;
    }
  },

  // Upload users in bulk via Excel/CSV file
  uploadUsersBulk: async (formData: FormData): Promise<BulkUploadResponse> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      let endpoint;
      
      if (companySlug) {
        endpoint = `${API_URL}/auth/${companySlug}/users/bulk-upload/`;
      } else {
        throw new Error('Company context is required to upload users');
      }
      
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('Upload response not OK:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('Error data:', errorData);
          throw new Error(errorData.detail || 'Failed to upload users');
        } catch (e) {
          console.error('Could not parse error response as JSON');
          throw new Error(`Failed to upload users: ${response.status} ${response.statusText}`);
        }
      }
      

      return await response.json();
    } catch (error) {
      console.error('Upload users error:', error);
      throw error;
    }
  },

  // Get all departments for a company
  getDepartments: async (): Promise<Department[]> => {
    try {
      const companySlug = getCompanySlug();
      const superAdmin = isSuperAdmin();
      
      if (!companySlug) {
        throw new Error('Company context is required to fetch departments');
      }
      
      const endpoint = `${API_URL}/auth/${companySlug}/departments/`;
      
      const response = await fetchWithAuth(endpoint, {
        headers: {
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Get departments error:', error);
      throw error;
    }
  },

  // Add a new department
  addDepartment: async (name: string): Promise<Department> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      let endpoint;
      
      if (companySlug) {
        endpoint = `${API_URL}/auth/${companySlug}/departments/`;
      } else {
        throw new Error('Company context is required to add a department');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add department');
      }

      return await response.json();
    } catch (error) {
      console.error('Add department error:', error);
      throw error;
    }
  },

  // Delete a department
  deleteDepartment: async (departmentId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      let endpoint;
      
      if (companySlug) {
        endpoint = `${API_URL}/auth/${companySlug}/departments/${departmentId}/`;
      } else {
        throw new Error('Company context is required to delete a department');
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Delete department error:', error);
      throw error;
    }
  },

  // Update user's department
  updateUserDepartments: async (userId: string, departments: string[]): Promise<User> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Check if we're in a company-specific context
      const companySlug = getCompanySlug();
      
      // Check if the user is a Super Admin
      const superAdmin = isSuperAdmin();
      
      let endpoint;
      
      if (companySlug) {
        endpoint = `${API_URL}/auth/${companySlug}/users/${userId}/update-department/`;
      } else {
        throw new Error('Company context is required to update user department');
      }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(superAdmin ? { 'X-Super-Admin': 'true' } : {}),
        },
        body: JSON.stringify({ departments }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user department');
      }

      return await response.json();
    } catch (error) {
      console.error('Update user department error:', error);
      throw error;
    }
  },
};

// LMS Campaign service
export interface AIReport {
  report_id: string;
  report_name: string;
  status: 'generating' | 'completed' | 'failed';
  campaigns_count: number;
  start_date: string;
  end_date: string;
  created_at: string;
  completed_at?: string;
  pdf_available: boolean;
}

export const phishingService = {
  // Get all phishing campaigns for the current company
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const response = await fetchWithAuth(`${API_URL}/email/campaigns/`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },
};

export const aiReportService = {
  // Generate or get existing AI report
  async generateReport(): Promise<AIReport> {
    try {
      const response = await fetchWithAuth(`${API_URL}/email/ai-reports/generate/`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }
      return await response.json();
    } catch (error) {
      console.error('Error generating AI report:', error);
      throw error;
    }
  },

  // Get report status
  async getReportStatus(reportId: string): Promise<AIReport> {
    try {
      const response = await fetchWithAuth(`${API_URL}/email/ai-reports/${reportId}/status/`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get report status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting report status:', error);
      throw error;
    }
  },

  // Download report PDF
  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const response = await fetchWithAuth(`${API_URL}/email/ai-reports/${reportId}/download/`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download report');
      }
      return await response.blob();
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  },

  // List all reports for the company
  async listReports(): Promise<AIReport[]> {
    try {
      const response = await fetchWithAuth(`${API_URL}/email/ai-reports/`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list reports');
      }
      return await response.json();
    } catch (error) {
      console.error('Error listing reports:', error);
      throw error;
    }
  },
};

export const lmsService = {
  async getQuickInsights(): Promise<QuickInsightsData> {
    const response = await fetchWithAuth(`${API_URL}/lms/quick-insights/`);
    if (!response.ok) {
      throw new Error('Failed to fetch quick insights');
    }
    return await response.json();
  },

  // Get campaigns assigned to the current user
  getUserCampaigns: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Only check if user is a super admin
      const userRole = localStorage.getItem('userRole');
      
      if (userRole === 'super_admin') {
        // For super admins, return empty array
        return [];
      }
      
      const companySlug = getCompanySlug();
      if (!companySlug) throw new Error('Company context is required to fetch user campaigns');
      
      // Make the API request to get user-specific campaigns
      const response = await fetch(`${API_URL}/user-campaigns/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          
          // Special handling for the "User does not belong to any company" error
          if (errorData.error === "User does not belong to any company") {
            return [];
          }
          
          // For other errors, throw so we can debug
          throw new Error(errorData.detail || errorData.error || `Failed to fetch user campaigns: ${response.status}`);
        } catch (jsonError) {
          // If we can't parse the error as JSON, throw with status
          throw new Error(`Failed to fetch user campaigns: ${response.status} ${response.statusText}`);
        }
      }
      
      return await response.json();
    } catch (error) {
      // Only return empty array for super admins, otherwise throw
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'super_admin') {
        return [];
      }
      throw error;
    }
  },

  markCourseCompleted: async (campaignId: string, courseId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/mark-course-completed/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          campaign_id: campaignId,
          course_id: courseId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark course as completed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking course as completed:', error);
      throw error;
    }
  },

  // Fetch certificates for completed campaigns in the current company
  getCertificates: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/lms/certificates/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch certificates: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  },

  // Download certificate PDF
  downloadCertificate: async (certificateId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_URL}/lms/certificates/${certificateId}/download/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to download certificate: ${response.status}`);
      }

      // Return blob for caller to trigger download
      return await response.blob();
    } catch (error) {
      console.error('Certificate download error:', error);
      throw error;
    }
  },
};

// Add an interceptor to handle token refresh
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const redirectToLogin = () => {
    const slug = getCompanySlug() || localStorage.getItem('companySlug') || '';
    authService.logout();
    window.location.href = slug ? `/${slug}/login` : '/login';
  };

  const token = localStorage.getItem('token');
  
  if (!token) {
    redirectToLogin();
    throw new Error('No authentication token found');
  }

  // Ensure the URL is absolute by checking if it starts with http or https
  // If it doesn't, prepend the API_URL (without the /api part)
  const absoluteUrl = url.startsWith('http') 
    ? url 
    : url.startsWith('/api') 
      ? `https://phishaware-backend-production.up.railway.app${url}` 
      : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': options.headers?.['Content-Type'] || 'application/json',
  };

  try {
    const response = await fetch(absoluteUrl, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      try {
        const newToken = await authService.refreshToken();
        if (!newToken) {
          throw new Error('Failed to refresh token');
        }
        
        // Update the authorization header with the new token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`
        };
        
        // Retry the request with the new token
        const retryResponse = await fetch(absoluteUrl, {
          ...options,
          headers: newHeaders,
        });
        
        if (retryResponse.status === 401) {
          // If we still get 401 after refresh, force logout
          redirectToLogin();
          throw new Error('Session expired after token refresh');
        }
        
        return retryResponse;
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, force logout and redirect to login
        redirectToLogin();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch with auth error:', error, 'URL:', absoluteUrl);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      // Network error or server down
      console.error('Network error - please check your connection');
    }
    throw error;
  }
};

export default authService;

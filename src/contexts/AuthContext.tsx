import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, companySlug?: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        
        // Check if we're on a valid company path
        const pathParts = location.pathname.split('/');
        const possibleCompanySlug = pathParts[1];
        
        // Skip known system routes that aren't company slugs
        const systemRoutes = ['unauthorized', '', 'login', 'register', 'reset-password'];
        
        if (systemRoutes.includes(possibleCompanySlug)) {
          // We're on a system route, use the stored company slug if available
          const storedCompanySlug = localStorage.getItem('companySlug');
          
          if (storedCompanySlug) {
            // Temporarily override the company slug in the URL for the API call
            const originalGetCompanySlug = window.location.pathname;
            window.history.replaceState(null, '', `/${storedCompanySlug}${location.search}`);
            
            try {
              const userData = await authService.getProfile();
              setUser(userData);
            } finally {
              // Restore the original URL
              window.history.replaceState(null, '', originalGetCompanySlug);
            }
          } else {
            // No stored company slug, we can't fetch the profile
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Normal case - fetch profile with current URL
          const userData = await authService.getProfile();
          setUser(userData);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Load user on initial mount and when location changes
  useEffect(() => {
    refreshUser();
  }, []);
  
  // This effect ensures we maintain authentication state during navigation
  useEffect(() => {
    // Just check if the token exists - don't make API calls on every navigation
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [location.pathname]);

  const login = async (email: string, password: string, companySlug?: string) => {
    try {
      // authService.login only accepts email and password
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Navigate to the appropriate dashboard based on company context
      const currentCompanySlug = companySlug || localStorage.getItem('companySlug');
      if (currentCompanySlug) {
        navigate(`/${currentCompanySlug}/dashboard`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    // Since authService doesn't have register, we'll just redirect to login
    // This would need to be implemented in the actual API service
    const currentCompanySlug = localStorage.getItem('companySlug');
    if (currentCompanySlug) {
      navigate(`/${currentCompanySlug}/login`);
    } else {
      navigate('/');
    }
  };

  const logout = () => {
    const currentCompanySlug = localStorage.getItem('companySlug');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to company-specific login if in a company context
    if (currentCompanySlug) {
      // Use window.location to force a full page reload
      window.location.href = `/${currentCompanySlug}/login`;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      login, 
      register, 
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

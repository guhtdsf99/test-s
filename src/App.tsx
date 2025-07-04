import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import UserRoleRedirect from "./components/auth/UserRoleRedirect";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import TemplateEditor from "./pages/TemplateEditor";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import LMSCampaigns from "./pages/LMSCampaigns";
import UserManagement from "./pages/UserManagement";
import Sender from "./pages/Sender";
import Login from "./pages/Login";
import SelectCompany from "./pages/SelectCompany";
import ResetPassword from "./pages/ResetPassword";
import Campaigns from "./pages/Campaigns";
import EmployeeCourses from "./pages/EmployeeCourses";
import ProfileSettings from "./pages/ProfileSettings";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import AIChatbot from "./pages/AIChatbot";
import { CompanyRoute } from "./components/auth/CompanyRoute";

const queryClient = new QueryClient();

// Helper function to check if a path is a company slug
const isCompanySlug = (path: string): boolean => {
  // List of known routes that are not company slugs
  const knownRoutes = [
    'login', 'register', 'dashboard', 'templates', 'campaigns',
    'analytics', 'users', 'profile', 'admin', 'reset-password',
    'template-editor', 'lms-campaigns', 'user-management',
    'employee-courses', 'profile-settings', 'super-admin'
  ];
  
  return !knownRoutes.includes(path);
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Root route - show home page */}
          <Route path="/" element={<Index />} />
          
          {/* Global routes */}
          <Route path="/" element={<SelectCompany />} />
          <Route path="/super-admin" element={<SuperAdminPanel />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Company-specific routes with validation */}
          <Route path=":companySlug" element={<CompanyRoute />}>
            <Route index element={<UserRoleRedirect />} />
            
            {/* Public routes */}
            <Route path="login" element={<Login />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'company_admin']} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="templates" element={<Templates />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="sender" element={<Sender />} />
              <Route path="lms-campaigns" element={<LMSCampaigns />} />
              <Route path="ai-chatbot" element={<AIChatbot />} />
            </Route>
            
            {/* Routes accessible to all authenticated users */}
            <Route element={<ProtectedRoute restrictUserRole={false} />}>
              <Route path="employee-courses" element={<EmployeeCourses />} />
              <Route path="profile-settings" element={<ProfileSettings />} />
              <Route path="ai-chatbot" element={<AIChatbot />} />
              {/* Additional non-admin routes can go here */}
            </Route>
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

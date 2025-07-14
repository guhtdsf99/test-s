import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, Book, BookOpen, FileText, BarChart, BarChart3, Users, Mail, LogOut, User, Send, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const { companySlug } = useParams<{ companySlug?: string }>();
  
  // Get user's display name and role
  const userName = user?.first_name || user?.username || '';
  const userRole = user?.role?.toLowerCase() || '';
  
  // Determine if the user is a regular user (not admin or company admin)
  const isRegularUser = userRole === 'user';
  
  // Determine if the user has admin privileges (admin, super_admin, or company_admin)
  const hasAdminPrivileges = ['admin', 'super_admin', 'company_admin'].includes(userRole);
  
  // Helper function to generate company-aware links
  const getLink = (path: string) => {
    if (companySlug) {
      return `/${companySlug}${path}`;
    }
    return path;
  };
  
  // Helper function to return sidebar link classes (matches design in shield-07)
  const getLinkClasses = (path: string) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 w-full ` +
    (isActive(path)
      ? 'bg-[#56393b] text-white font-medium' // active: maroon background, white text
      : 'text-gray-300 hover:bg-gray-700 hover:text-white');
  
  // Check if a path is active, considering company context and sub-routes
  const isActive = (path: string) => {
    if (companySlug) {
      // For company-specific routes, check if the path starts with the company path
      const companyPath = `/${companySlug}${path}`;
      // Special handling for template-editor to match both /template-editor and /template-editor/:id
      if (path === '/template-editor') {
        return location.pathname.startsWith(companyPath);
      }
      return location.pathname === companyPath;
    }
    // For global routes, check if path matches exactly
    return location.pathname === path;
  };
  
  // No need for additional auth-related effects as the AuthContext handles authentication state
  
  const handleLogout = () => {
    logout(); // Use the logout function from AuthContext
  };
  
  return (
    <>
      {/* Top-right welcome (desktop only) */}
      {isAuthenticated && (
        <div className="hidden"> {/* تم إخفاء الشريط العلوي */}
        <div className="flex flex-col items-center leading-snug text-center">
          <span>Welcome back,</span>
          <span className="font-medium">{userName}</span>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-6 w-6 ml-1 cursor-pointer">
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-gray-800 border-gray-700 text-gray-200">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
      <nav className="text-white md:h-screen md:w-64 md:fixed md:top-0 md:left-0 md:flex md:flex-col md:overflow-y-auto z-40 border-b md:border-b-0 md:border-r border-gray-700 py-4 md:px-0 px-6 w-full" style={{ backgroundColor: '#439797' }}>
        <div className="max-w-7xl md:mx-0 mx-auto flex justify-between items-center md:flex-col">
          {/* Logo box */}
          <div className="w-full p-4 border-b border-gray-700 flex justify-center items-center">
            <img
              src="/cbulwark-logo-2.png"
              alt="CBulwark Logo"
              className="h-12 w-auto"
            />
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:flex-col gap-4 mt-6 w-full px-4">
            {/* Only show Home link when not in a company context and has admin privileges */}
            {!companySlug && hasAdminPrivileges && (
              <Link to="/" className={getLinkClasses("/")}>
                Home
              </Link>
            )}
            
            {/* Only show these links for users with admin privileges */}
            {hasAdminPrivileges && (
              <>
                <Link to={getLink("/dashboard")} className={getLinkClasses("/dashboard")}>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link to={getLink("/campaigns")} className={getLinkClasses("/campaigns")}>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>Campaigns</span>
                  </div>
                </Link>

                <Link to={getLink("/user-management")} className={getLinkClasses("/user-management")}>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </div>
                </Link>
                {/* Sender tab has been removed */}
              </>
            )}
            
            {/* Training link is shown only to admin users */}
            {hasAdminPrivileges && (
              <Link to={getLink("/lms-campaigns")} className={getLinkClasses("/lms-campaigns")}>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Training</span>
                </div>
              </Link>
            )}
            
            {/* Employee Courses link is shown to all users */}
            <Link to={getLink("/employee-courses")} className={getLinkClasses("/employee-courses")}>
              <div className="flex items-center gap-1">
                <Book className="h-4 w-4" />
                <span>My Courses</span>
              </div>
            </Link>

            {/* AI Chatbot link */}
            <Link to={getLink("/ai-chatbot")} className={getLinkClasses("/ai-chatbot")}>
              <div className="flex items-center gap-1">
                <Bot className="h-4 w-4" />
                <span>Cbulwark AI</span>
              </div>
            </Link>
            <Link to={getLink("/lms-campaigns-gamified")} className={getLinkClasses("/lms-campaigns-gamified")}>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="">Gamified LMS</span>
                  </div>
                </Link>
            {isAuthenticated ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-200">
                  <Link to={getLink("/profile-settings")}>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to={companySlug ? `/${companySlug}/login` : "/"}>
                <Button variant="default" className="bg-[#907527] hover:bg-[#705b1e]">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 py-2 px-4 animate-in">
            <div className="flex flex-col gap-4">
              {/* Only show Home link when not in a company context and has admin privileges */}
              {!companySlug && hasAdminPrivileges && (
                <Link to="/" className={getLinkClasses("/")}>
                  Home
                </Link>
              )}
              
              {/* Only show these links for users with admin privileges */}
              {hasAdminPrivileges && (
                <>
                  <Link to={getLink("/dashboard")} className={getLinkClasses("/dashboard")}>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  <Link to={getLink("/template-editor")} className={getLinkClasses("/template-editor")}>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>Templates</span>
                    </div>
                  </Link>
                  <Link to={getLink("/campaigns")} className={getLinkClasses("/campaigns")}>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>Campaigns</span>
                    </div>
                  </Link>
                  <Link to={getLink("/analytics")} className={getLinkClasses("/analytics")}>
                    <div className="flex items-center gap-1">
                      <BarChart className="h-4 w-4" />
                      <span>Analytics</span>
                    </div>
                  </Link>
                  <Link to={getLink("/user-management")} className={getLinkClasses("/user-management")}>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </div>
                  </Link>
                  <Link to={getLink("/sender")} className={getLinkClasses("/sender")}>
                    <div className="flex items-center gap-1">
                      <Send className="h-4 w-4" />
                      <span>Sender</span>
                    </div>
                  </Link>
                  <Link to={getLink("/lms-campaigns-gamified")} className={getLinkClasses("/lms-campaigns-gamified")}> 
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span className="">Gamified LMS</span>
                    </div>
                  </Link>
                </>
              )}
              
              {/* Training link is shown only to admin users */}
              {hasAdminPrivileges && (
                <Link to={getLink("/lms-campaigns")} className={getLinkClasses("/lms-campaigns")}>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>Training</span>
                  </div>
                </Link>
              )}
              
              {/* Employee Courses link is shown to all users */}
              <Link to={getLink("/employee-courses")} className={getLinkClasses("/employee-courses")}>
                <div className="flex items-center gap-1">
                  <Book className="h-4 w-4" />
                  <span>My Courses</span>
                </div>
              </Link>
              
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link to={getLink("/profile-settings")} className="flex items-center gap-1 text-gray-700 hover:text-[#907527] py-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Button 
                    variant="default" 
                    className="bg-[#907527] hover:bg-[#705b1e] w-full flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <Link to={companySlug ? `/${companySlug}/login` : "/"}>
                  <Button variant="default" className="bg-[#907527] hover:bg-[#705b1e] w-full">Login</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;

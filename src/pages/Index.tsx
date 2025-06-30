import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail, Users, ChartBar, BookOpen, CheckCircle, ChevronRight, UserRound, Building } from 'lucide-react';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserIntegrations } from '@/components/integrations/UserIntegrations';
import { UserAccessControl } from '@/components/admin/UserAccessControl';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return <div className="min-h-screen flex flex-col">
      {/* Custom Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 w-full">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/876a553e-d478-4016-a8f0-1580f492ca19.png" alt="CSWORD Logo" className="h-10" />
          </div>
          
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-white to-[#f5f3e8] px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* CBulwark Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/876a553e-d478-4016-a8f0-1580f492ca19.png" 
              alt="CBulwark Logo" 
              className="h-24 w-auto" 
            />
          </div>
          
          {/* Welcome Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-[#0a192f] mb-6">
            Welcome to our AI-powered Awareness Platform
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Check CSWORD AI for more information about other services
          </p>
          
          {/* Clickable Button */}
          <Button 
            className="bg-[#0a192f] hover:bg-[#1a2f4f] text-white py-6 px-8 rounded-lg text-lg font-medium transition-colors duration-200"
            onClick={() => window.open('https://csword.ai', '_blank')}
          >
            Visit CSWORD AI
          </Button>
        </div>
      </section>
      
      {/* User Management Section */}
      
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-[#f9f8f4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-[#0a192f]">Everything You Need to Create Effective Phishing Simulations</h2>
            <p className="text-gray-600 text-lg">Our comprehensive platform provides all the tools to build, deploy, and analyze phishing awareness campaigns.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-[#f5f3e8] p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-[#907527]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#0a192f]">Customizable Templates</h3>
                <p className="text-gray-600">Choose from dozens of realistic templates or create your own custom phishing scenarios.</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-[#f5f3e8] p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#907527]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#0a192f]">Target Audience Management</h3>
                <p className="text-gray-600">Easily segment your organization and target specific departments or individuals.</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-[#f5f3e8] p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <ChartBar className="h-6 w-6 text-[#907527]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#0a192f]">Detailed Analytics</h3>
                <p className="text-gray-600">Track campaign performance with comprehensive metrics and identify security gaps.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-[#0a192f]">How CSWORD Academy Works</h2>
            <p className="text-gray-600 text-lg">Three simple steps to strengthen your organization's security awareness</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#907527] text-white flex items-center justify-center font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3 text-[#0a192f]">Create Campaigns</h3>
              <p className="text-gray-600 mb-4">Design custom phishing simulations or choose from our template library.</p>
              <Link to="/dashboard" className="text-[#907527] hover:text-[#705b1e] flex items-center">
                Learn more <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#907527] text-white flex items-center justify-center font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3 text-[#0a192f]">Deploy to Your Team</h3>
              <p className="text-gray-600 mb-4">Send phishing simulations to targeted groups at scheduled times.</p>
              <Link to="/dashboard" className="text-[#907527] hover:text-[#705b1e] flex items-center">
                Learn more <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#907527] text-white flex items-center justify-center font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3 text-[#0a192f]">Track & Educate</h3>
              <p className="text-gray-600 mb-4">Monitor results and provide instant education to those who need it most.</p>
              <Link to="/dashboard" className="text-[#907527] hover:text-[#705b1e] flex items-center">
                Learn more <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#0a192f] to-[#907527]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Strengthen Your Security Culture?</h2>
          <p className="text-white text-opacity-90 text-lg mb-8 max-w-2xl mx-auto">
            Start creating phishing simulations today and turn your employees into your strongest security asset.
          </p>
          <Button className="bg-white text-[#0a192f] hover:bg-gray-100 py-6 px-8 rounded-lg text-lg">
            Get Started For Free
          </Button>
        </div>
      </section>
      
      <Footer />
      <Toaster />
    </div>;
};
export default Index;
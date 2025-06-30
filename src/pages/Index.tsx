import React from 'react';
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/876a553e-d478-4016-a8f0-1580f492ca19.png" 
              alt="CBulwark Logo" 
              className="h-24 w-auto" 
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[#0a192f] mb-6">
            Welcome to our AI-powered Awareness Platform
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Check CSWORD AI for more information about other services
          </p>
          
          <Button 
            className="bg-[#0a192f] hover:bg-[#1a2f4f] text-white py-6 px-8 rounded-lg text-lg font-medium transition-colors duration-200"
            onClick={() => window.open('https://csword.ai', '_blank')}
          >
            Visit CSWORD AI
          </Button>
        </div>
      </section>
      
      <Toaster />
    </div>
  );
};
};
export default Index;
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <main 
          className="flex-grow p-6 md:p-8"
          style={{
            background: 'linear-gradient(to bottom, #55393bb0, #ffffff)'
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
};

export default MainLayout;

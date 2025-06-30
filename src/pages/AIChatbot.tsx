import React, { useState, useEffect } from 'react';
import { ChatBot } from 'react-chatbotify';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const AIChatbot = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled on the html element
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkMode(html.classList.contains('dark'));
    });
    
    // Initial check
    setIsDarkMode(html.classList.contains('dark'));
    
    // Observe changes to the class attribute
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const flow = {
    start: {
      message: "Hello! I'm your AI security assistant. How can I help you today?",
      path: 'user_input',
    },
    user_input: {
      message: (params: any) => {
        return `You said: ${params.userInput}`;
      },
      path: 'user_input',
    },
  };

  const themeConfig = {
    theme: {
      primaryColor: '#56393b',
      secondaryColor: '#3d292a',
      fontFamily: 'Arial, sans-serif',
      textColor: isDarkMode ? '#ffffff' : '#333333',
      botMessageBg: isDarkMode ? '#3d292a' : '#f5f5f5',
      userMessageBg: '#56393b',
      userTextColor: '#ffffff',
    },
    header: {
      title: 'AI Security Assistant',
      showAvatar: true,
      avatar: '/cbulwark-logo-2.png',
    },
    chatButton: {
      icon: <Send className="h-5 w-5" />,
    },
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-card text-card-foreground rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">AI Security Assistant</h1>
          <p className="text-muted-foreground">Ask me anything about cybersecurity or our platform</p>
        </div>
        <div className="p-4 h-[70vh] overflow-y-auto">
          <ChatBot
            options={{
              theme: themeConfig.theme,
              header: themeConfig.header,
              chatButton: themeConfig.chatButton,
            }}
            flow={flow}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '0.5rem',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;

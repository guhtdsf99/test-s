import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Bot, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
};

const AIChatbot = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI security assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('phishing')) {
      return "Phishing is a cyber attack that uses disguised email as a weapon. The goal is to trick the email recipient into believing that the message is something they want or need, like a request from their bank or a note from someone in their company, and to click a link or download an attachment.";
    }
    
    if (message.includes('password') || message.includes('credentials')) {
      return "For password security, always use strong, unique passwords for each account. Consider using a password manager. Enable two-factor authentication (2FA) wherever possible for an extra layer of security.";
    }
    
    if (message.includes('vpn') || message.includes('network')) {
      return "A VPN (Virtual Private Network) encrypts your internet connection, making it more secure, especially on public Wi-Fi networks. Always use your organization's approved VPN when accessing company resources remotely.";
    }
    
    if (message.includes('report') || message.includes('suspicious')) {
      return "If you receive a suspicious email or message, do not click any links or download attachments. Report it to your IT security team immediately using the 'Report Phishing' button in your email client or by forwarding it to your security operations center.";
    }
    
    return `I understand you're asking about "${userMessage}". As a security assistant, I can help with:\n\n` +
      "• Phishing awareness and prevention\n" +
      "• Password security best practices\n" +
      "• Secure browsing habits\n" +
      "• Company security policies\n" +
      "• Reporting security incidents\n\n" +
      "How can I assist you with these topics?";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage) return;

    // Add user message
    const userMessageObj: Message = {
      id: messages.length + 1,
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add loading message
    const loadingMessage: Message = {
      id: messages.length + 2,
      text: 'Thinking...',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessageObj, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const botResponse = getBotResponse(userMessage);
      
      // Remove loading message and add bot response
      setMessages(prev => [
        ...prev.filter(msg => !msg.isLoading),
        {
          id: prev.length + 2,
          text: botResponse,
          sender: 'bot' as const,
          timestamp: new Date(),
        }
      ]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      // Update loading message with error
      setMessages(prev => [
        ...prev.filter(msg => !msg.isLoading),
        {
          id: prev.length + 2,
          text: 'Sorry, I encountered an error. Please try again later.',
          sender: 'bot' as const,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Security Assistant</h1>
            <p className="text-muted-foreground">Get instant help with security-related questions</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Security Assistant</CardTitle>
                <CardDescription>
                  Ask me anything about cybersecurity, phishing, or security best practices
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[60vh] overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-background border rounded-bl-none'
                    }`}
                  >
                    {message.sender === 'bot' && !message.isLoading && (
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4" />
                        <span className="text-xs font-medium">Security Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">
                      {message.isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {message.text}
                        </span>
                      ) : (
                        message.text
                      )}
                    </p>
                    {!message.isLoading && (
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AIChatbot;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/services/api';
import { EMAIL_SENT_API_ENDPOINT } from '@/config';

// Define interface for email data
interface EmailData {
  id: number;
  subject: string;
  recipient_email: string;
  recipient_name: string;
  sent: boolean;
  read: boolean;
  clicked: boolean;
  created_at: string;
  sent_at: string | null;
}

interface SentEmailsListProps {
  currentUser: User | null;
}

const SentEmailsList: React.FC<SentEmailsListProps> = ({ currentUser }) => {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch sent emails
  const fetchSentEmails = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${EMAIL_SENT_API_ENDPOINT}?user_id=${currentUser.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch sent emails: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data: EmailData[] = await response.json();
      setEmails(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching sent emails:', error);
      setError(error instanceof Error ? error.message : 'Failed to load sent emails');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchSentEmails();
  }, [currentUser]);
  
  // Set up polling to check for updates every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchSentEmails();
    }, 10000); // 10 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [currentUser]);
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Sent Emails</CardTitle>
        <CardDescription>Track the status of emails you've sent</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : emails.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No emails sent yet</p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {emails.map((email) => (
                <div key={email.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{email.subject}</h3>
                    <div className="flex space-x-2">
                      {email.sent && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Sent
                        </Badge>
                      )}
                      {email.read && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Read
                        </Badge>
                      )}
                      {email.clicked && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Clicked
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    To: {email.recipient_name} ({email.recipient_email})
                  </p>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>Created: {formatDate(email.created_at)}</span>
                    {email.sent_at && <span>Sent: {formatDate(email.sent_at)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SentEmailsList;

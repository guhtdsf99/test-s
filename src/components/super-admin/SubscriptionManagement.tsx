import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar as CalendarIcon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Subscription {
  id: string;
  companyName: string;
  adminEmail: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'pending';
}

export const SubscriptionManagement = () => {
  const { toast } = useToast();

  // Mock subscription data
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: '1',
      companyName: 'Acme Corp',
      adminEmail: 'john@acmecorp.com',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-01-01'),
      status: 'active',
    },
    {
      id: '2',
      companyName: 'TechSolutions Inc.',
      adminEmail: 'sara@techsolutions.com',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2026-02-15'),
      status: 'active',
    },
    {
      id: '3',
      companyName: 'Global Enterprises',
      adminEmail: 'mike@globalent.com',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-01-01'),
      status: 'expired',
    },
    {
      id: '4',
      companyName: 'New Startup',
      adminEmail: 'alex@newstartup.com',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-06-01'),
      status: 'pending',
    }
  ]);

  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setStartDate(subscription.startDate);
    setEndDate(subscription.endDate);
    setIsDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (editingSubscription && startDate && endDate) {
      // Get current status based on dates
      const currentDate = new Date();
      let newStatus: 'active' | 'expired' | 'pending';
      
      if (currentDate > endDate) {
        newStatus = 'expired';
      } else if (currentDate < startDate) {
        newStatus = 'pending';
      } else {
        newStatus = 'active';
      }
      
      // Update subscription dates with properly typed status
      const updatedSubscriptions = subscriptions.map(subscription => 
        subscription.id === editingSubscription.id 
          ? { 
              ...subscription,
              startDate,
              endDate,
              status: newStatus
            } 
          : subscription
      );
      
      setSubscriptions(updatedSubscriptions);
      
      toast({
        title: "Subscription updated",
        description: `${editingSubscription.companyName}'s subscription has been updated successfully.`,
      });
      
      setIsDialogOpen(false);
      setEditingSubscription(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#907527]" />
          Subscription Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Admin Email</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell className="font-medium">{subscription.companyName}</TableCell>
                <TableCell>{subscription.adminEmail}</TableCell>
                <TableCell>{format(subscription.startDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(subscription.endDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(subscription.status) as any}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditSubscription(subscription)}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Dates
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Subscription Dates</DialogTitle>
            </DialogHeader>
            {editingSubscription && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <p className="font-medium">{editingSubscription.companyName}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={date => 
                          startDate ? date < startDate : false
                        }
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

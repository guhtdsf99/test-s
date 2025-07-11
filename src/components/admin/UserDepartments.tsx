import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Users, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

export const UserDepartments = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState(['IT', 'HR', 'Finance', 'Marketing', 'Operations']);
  const [newDepartment, setNewDepartment] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [movingUser, setMovingUser] = useState<User | null>(null);
  const [targetDepartment, setTargetDepartment] = useState('');
  
  // Mock data for demonstration
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'Ahmed Mohammed', email: 'ahmed@example.com', department: 'IT' },
    { id: 'u2', name: 'Sarah Ali', email: 'sara@example.com', department: 'HR' },
    { id: 'u3', name: 'Mohammed Khalid', email: 'mohammed@example.com', department: 'Finance' },
    { id: 'u4', name: 'Omar Said', email: 'omar@example.com', department: 'Marketing' },
    { id: 'u5', name: 'Fatima Ahmed', email: 'fatima@example.com', department: 'HR' },
  ]);

  const handleAddDepartment = () => {
    if (!newDepartment) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    if (departments.includes(newDepartment)) {
      toast({
        title: "Error",
        description: "This group already exists",
        variant: "destructive",
      });
      return;
    }

    setDepartments([...departments, newDepartment]);
    setNewDepartment('');
    
    toast({
      title: "Group Added",
      description: `${newDepartment} group has been added successfully`,
    });
  };

  const handleDeleteDepartment = (dept: string) => {
    // Check if there are users in this department
    const usersInDept = users.filter(user => user.department === dept);
    
    if (usersInDept.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete a group with users. Please move users first.",
        variant: "destructive",
      });
      return;
    }
    
    setDepartments(departments.filter(d => d !== dept));
    toast({
      title: "Group Deleted",
      description: `${dept} group has been deleted successfully`,
    });
  };

  const handleMoveUser = () => {
    if (!movingUser || !targetDepartment) {
      toast({
        title: "Error",
        description: "Please select a user and target group",
        variant: "destructive",
      });
      return;
    }

    setUsers(users.map(user => {
      if (user.id === movingUser.id) {
        return { ...user, department: targetDepartment };
      }
      return user;
    }));

    toast({
      title: "User Moved",
      description: `${movingUser.name} has been moved to ${targetDepartment} successfully`,
    });
    
    setMovingUser(null);
    setTargetDepartment('');
  };

  // Filter users by selected department
  const filteredUsers = selectedDepartment === 'all'
    ? users
    : users.filter(user => user.department === selectedDepartment);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#907527]" />
          Group Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Add New Group</h3>
            <div className="flex items-center gap-2">
              <Input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Group name"
              />
              <Button 
                onClick={handleAddDepartment}
                className="bg-[#907527] hover:bg-[#705b1e]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Current Groups</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departments.map((dept, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded flex items-center justify-between">
                  <span>{dept}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteDepartment(dept)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Users by Group</h3>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-department">Filter by Group:</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setMovingUser(user)}
                          >
                            Move
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Move User to Another Group</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="mb-4">
                              Moving <span className="font-bold">{movingUser?.name}</span> from <span className="font-bold">{movingUser?.department}</span> Group
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="target-department">New Group</Label>
                              <Select value={targetDepartment} onValueChange={setTargetDepartment}>
                                <SelectTrigger id="target-department">
                                  <SelectValue placeholder="Select Group" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.filter(d => d !== movingUser?.department).map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              onClick={handleMoveUser}
                              className="bg-[#907527] hover:bg-[#705b1e]"
                            >
                              Confirm Move
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

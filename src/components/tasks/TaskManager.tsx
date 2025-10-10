'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import type { TaskStatus } from '@/generated/prisma';

interface ClientTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  clientName: string | null;
  createdAt: string;
  updatedAt: string;
  shareLink: {
    code: string;
    createdAt: string;
  };
  completion?: {
    completedBy: string;
    completedAt: string;
    feedback: string;
    notes: string | null;
  };
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
}

interface TaskManagerProps {
  appSlug: string;
}

export default function TaskManager({ appSlug }: TaskManagerProps) {
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    completedBy: '',
    feedback: '',
    notes: '',
  });

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSlug]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/apps/${appSlug}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status } : task
        ));
        
        // Update stats
        setStats(prev => {
          const newStats = { ...prev };
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            const oldStatusKey = task.status.toLowerCase() as keyof TaskStats;
            const newStatusKey = status.toLowerCase() as keyof TaskStats;
            newStats[oldStatusKey] = (newStats[oldStatusKey] as number) - 1;
            newStats[newStatusKey] = (newStats[newStatusKey] as number) + 1;
          }
          return newStats;
        });

        toast.success(`Task status updated to ${status}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const completeTask = async () => {
    if (!selectedTask || !completionForm.completedBy || !completionForm.feedback) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionForm),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === selectedTask.id ? updatedTask : task
        ));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          inProgress: prev.inProgress - 1,
          completed: prev.completed + 1,
        }));

        setShowCompleteDialog(false);
        setSelectedTask(null);
        setCompletionForm({ completedBy: '', feedback: '', notes: '' });
        toast.success('Task completed successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    } finally {
      setIsUpdating(false);
    }
  };

  const openCompleteDialog = (task: ClientTask) => {
    setSelectedTask(task);
    setCompletionForm({ completedBy: '', feedback: '', notes: '' });
    setShowCompleteDialog(true);
  };

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTasks = filterStatus === 'ALL' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Client Tasks</CardTitle>
          </div>
          <Select value={filterStatus} onValueChange={(value: TaskStatus | 'ALL') => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All ({stats.total})</SelectItem>
              <SelectItem value="PENDING">Pending ({stats.pending})</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress ({stats.inProgress})</SelectItem>
              <SelectItem value="COMPLETED">Completed ({stats.completed})</SelectItem>
              <SelectItem value="REJECTED">Rejected ({stats.rejected})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {filterStatus === 'ALL' 
                ? 'No client tasks submitted yet' 
                : `No ${filterStatus.toLowerCase()} tasks found`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-3 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTaskStatusIcon(task.status)}
                    <Badge className={getTaskStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Task #{task.shareLink.code.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                        className="transition-colors duration-200"
                      >
                        Start Work
                      </Button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={() => openCompleteDialog(task)}
                      >
                        Complete
                      </Button>
                    )}
                    {task.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'REJECTED')}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">{task.title}</h3>
                  <p className="text-gray-700 text-sm">{task.description}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {task.clientName || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Share code: {task.shareLink.code}
                  </div>
                </div>

                {task.completion && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Completed</span>
                    </div>
                    <p className="text-sm text-green-700 mb-1">{task.completion.feedback}</p>
                    {task.completion.notes && (
                      <p className="text-xs text-green-600">{task.completion.notes}</p>
                    )}
                    <p className="text-xs text-green-600 mt-2">
                      Completed by {task.completion.completedBy} on {new Date(task.completion.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Complete Task Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark this task as completed and provide feedback to the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedTask.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  From: {selectedTask.clientName || 'Anonymous'}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="completedBy">Completed By *</Label>
              <Input
                id="completedBy"
                placeholder="Your name or team name"
                value={completionForm.completedBy}
                onChange={(e) => setCompletionForm(prev => ({ ...prev, completedBy: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback">Completion Feedback *</Label>
              <Textarea
                id="feedback"
                placeholder="Describe what was completed and how it addresses the client's request..."
                value={completionForm.feedback}
                onChange={(e) => setCompletionForm(prev => ({ ...prev, feedback: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information, next steps, or technical details..."
                value={completionForm.notes}
                onChange={(e) => setCompletionForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={completeTask} disabled={isUpdating}>
              {isUpdating ? 'Completing...' : 'Complete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

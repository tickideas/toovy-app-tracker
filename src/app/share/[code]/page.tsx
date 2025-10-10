'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getStatusBadgeClass } from '@/lib/status';
import { 
  MessageCircle, 
  Plus, 
  Rocket, 
  Github,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import type { AppStatus, Period, Environment, TaskStatus } from '@/generated/prisma';

interface PublicAppData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  proposedDomain: string | null;
  githubUrl: string | null;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
  updates: Array<{
    id: string;
    date: string;
    period: Period;
    progress: number;
    summary: string;
    blockers: string | null;
    tags: string[] | null;
    createdAt: string;
  }>;
  deployments: Array<{
    id: string;
    environment: Environment;
    version: string;
    notes: string | null;
    deployedAt: string;
  }>;
  _count: {
    updates: number;
    deployments: number;
  };
}

interface SharePermissions {
  view: boolean;
  comment: boolean;
  create_tasks: boolean;
}

interface PublicPageData {
  app: PublicAppData;
  permissions: SharePermissions;
  shareInfo: {
    createdAt: string;
    expiresAt: string | null;
  };
}

interface Feedback {
  id: string;
  clientName: string | null;
  message: string;
  createdAt: string;
}

interface ClientTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  clientName: string | null;
  createdAt: string;
  updatedAt: string;
  completion?: {
    completedBy: string;
    completedAt: string;
    feedback: string;
    notes: string | null;
  };
}

export default function PublicSharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<PublicPageData | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({
    clientName: '',
    message: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    clientName: '',
  });

  useEffect(() => {
    fetchPublicData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchPublicData = async () => {
    try {
      const [appResponse, feedbacksResponse, tasksResponse] = await Promise.all([
        fetch(`/api/public/${code}`),
        fetch(`/api/public/${code}/feedback`),
        fetch(`/api/public/${code}/tasks`),
      ]);

      if (appResponse.ok) {
        const appData: PublicPageData = await appResponse.json();
        setData(appData);
      } else {
        notFound();
      }

      if (feedbacksResponse.ok) {
        const feedbacksData: Feedback[] = await feedbacksResponse.json();
        setFeedbacks(feedbacksData);
      }

      if (tasksResponse.ok) {
        const tasksData: ClientTask[] = await tasksResponse.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Failed to fetch public data:', error);
      notFound();
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackForm.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/${code}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackForm),
      });

      if (response.ok) {
        const newFeedback = await response.json();
        setFeedbacks(prev => [newFeedback, ...prev]);
        setFeedbackForm({ clientName: '', message: '' });
        setShowFeedbackDialog(false);
        toast.success('Feedback submitted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTask = async () => {
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/${code}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask, ...prev]);
        setTaskForm({ title: '', description: '', clientName: '' });
        setShowTaskDialog(false);
        toast.success('Task submitted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit task');
      }
    } catch (error) {
      console.error('Failed to submit task:', error);
      toast.error('Failed to submit task');
    } finally {
      setIsSubmitting(false);
    }
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{data.app.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={getStatusBadgeClass(data.app.status)}>
                  {data.app.status}
                </span>
                <span className="text-sm text-gray-500">
                  Shared {new Date(data.shareInfo.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to AppTracker
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            {data.permissions.create_tasks && (
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            )}
            {data.permissions.comment && (
              <TabsTrigger value="feedback">Feedback ({feedbacks.length})</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.app.description && (
                  <p className="text-gray-700">{data.app.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4">
                  {data.app.proposedDomain && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">🌐</span>
                      <a
                        href={data.app.proposedDomain}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {data.app.proposedDomain.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {data.app.githubUrl && (
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4 text-gray-500" />
                      <a
                        href={data.app.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        GitHub
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-6 text-sm text-gray-600">
                  <div>
                    <strong>{data.app._count.updates}</strong> progress updates
                  </div>
                  <div>
                    <strong>{data.app._count.deployments}</strong> deployments
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Updates</CardTitle>
              </CardHeader>
              <CardContent>
                {data.app.updates.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No progress updates yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.app.updates.map((update) => (
                      <div key={update.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{update.period}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(update.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{update.progress}%</span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(update.progress)}`}
                              style={{ width: `${update.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">Summary</h4>
                          <p className="text-sm text-gray-700">{update.summary}</p>
                        </div>

                        {update.blockers && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Blockers</h4>
                            <p className="text-sm text-orange-600">{update.blockers}</p>
                          </div>
                        )}

                        {update.tags && Array.isArray(update.tags) && update.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {update.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deployments */}
            {data.app.deployments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deployments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.app.deployments.map((deployment) => (
                      <div key={deployment.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                          <Rocket className="h-4 w-4 text-gray-500" />
                          <Badge variant="outline">
                            {deployment.environment}
                          </Badge>
                          <span className="font-mono text-sm">{deployment.version}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(deployment.deployedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          {data.permissions.create_tasks && (
            <TabsContent value="tasks" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Client Tasks</h2>
                <Button onClick={() => setShowTaskDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No tasks submitted yet</p>
                    <Button onClick={() => setShowTaskDialog(true)}>
                      Submit First Task
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getTaskStatusIcon(task.status)}
                            <Badge className={getTaskStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h3 className="font-medium mb-2">{task.title}</h3>
                        <p className="text-gray-700 text-sm mb-3">{task.description}</p>
                        
                        {task.clientName && (
                          <p className="text-xs text-gray-500">
                            Submitted by {task.clientName}
                          </p>
                        )}

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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Feedback Tab */}
          {data.permissions.comment && (
            <TabsContent value="feedback" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Client Feedback</h2>
                <Button onClick={() => setShowFeedbackDialog(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Leave Feedback
                </Button>
              </div>

              {feedbacks.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No feedback submitted yet</p>
                    <Button onClick={() => setShowFeedbackDialog(true)}>
                      Leave First Feedback
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <Card key={feedback.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {feedback.clientName || 'Anonymous'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{feedback.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Feedback</DialogTitle>
            <DialogDescription>
              Share your thoughts about this application&apos;s progress.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedbackName">Your Name (Optional)</Label>
              <Input
                id="feedbackName"
                placeholder="John Doe"
                value={feedbackForm.clientName}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedbackMessage">Feedback</Label>
              <Textarea
                id="feedbackMessage"
                placeholder="Share your thoughts, suggestions, or questions..."
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitFeedback} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Task/Request</DialogTitle>
            <DialogDescription>
              Submit a task or feature request for this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">Your Name (Optional)</Label>
              <Input
                id="taskName"
                placeholder="John Doe"
                value={taskForm.clientName}
                onChange={(e) => setTaskForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Task Title *</Label>
              <Input
                id="taskTitle"
                placeholder="Add user authentication feature"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Description *</Label>
              <Textarea
                id="taskDescription"
                placeholder="Describe what needs to be done and any specific requirements..."
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTaskDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitTask} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

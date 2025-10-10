'use client';

import {
  useState,
  useEffect,
  useCallback,
  use,
  type FormEvent,
  type ChangeEvent,
  type ChangeEventHandler
} from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { AppStatus, Period, Environment } from '@/generated/prisma';
import { getStatusBadgeClass } from '@/lib/status';
import { Rocket, Edit2, Trash2, Plus } from 'lucide-react';

interface AppDetails {
  id: string;
  name: string;
  description: string | null;
  proposedDomain: string | null;
  githubUrl: string | null;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
}

interface AppFormState {
  name: string;
  description: string;
  proposedDomain: string;
  githubUrl: string;
  status: AppStatus;
}

interface Update {
  id: string;
  appId: string;
  authorId: string;
  date: string;
  period: Period;
  progress: number;
  summary: string;
  blockers: string | null;
  tags: string[] | null;
  createdAt: string;
}

interface UpdateFormState {
  progress: number;
  summary: string;
  blockers: string;
  tags: string;
  period: Period;
}

interface Deployment {
  id: string;
  appId: string;
  environment: Environment;
  version: string;
  notes: string | null;
  deployedAt: string;
}

interface DeploymentFormState {
  environment: Environment;
  version: string;
  notes: string;
}

const statusOptions: AppStatus[] = [
  'IDEA',
  'PLANNING',
  'BUILDING',
  'TESTING',
  'DEPLOYING',
  'LIVE',
  'PAUSED',
  'ARCHIVED'
];

const periodOptions: Period[] = ['DAY', 'WEEK', 'MONTH'];

const environmentOptions: Environment[] = ['DEV', 'STAGING', 'PROD'];

const createDefaultUpdateForm = (): UpdateFormState => ({
  progress: 0,
  summary: '',
  blockers: '',
  tags: '',
  period: 'WEEK'
});

const createDefaultDeploymentForm = (): DeploymentFormState => ({
  environment: 'STAGING',
  version: '',
  notes: ''
});

export default function AppDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [app, setApp] = useState<AppDetails | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<AppFormState>({
    name: '',
    description: '',
    proposedDomain: '',
    githubUrl: '',
    status: 'PLANNING'
  });
  const [updateForm, setUpdateForm] = useState<UpdateFormState>(createDefaultUpdateForm());
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<Update | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploymentForm, setDeploymentForm] = useState<DeploymentFormState>(createDefaultDeploymentForm());
  const [isAddingDeployment, setIsAddingDeployment] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null);
  const [deleteDeploymentDialogOpen, setDeleteDeploymentDialogOpen] = useState(false);
  const [deploymentToDelete, setDeploymentToDelete] = useState<Deployment | null>(null);

  const fetchUpdates = useCallback(async () => {
    try {
      const response = await fetch(`/api/apps/${slug}/updates`);
      if (response.ok) {
        const data: Update[] = await response.json();
        setUpdates(data);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    }
  }, [slug]);

  const fetchDeployments = useCallback(async () => {
    try {
      const response = await fetch(`/api/apps/${slug}/deployments`);
      if (response.ok) {
        const data: Deployment[] = await response.json();
        setDeployments(data);
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  }, [slug]);

  const fetchApp = useCallback(async () => {
    try {
      const response = await fetch(`/api/apps/${slug}`);

      if (response.ok) {
        const data: AppDetails = await response.json();
        setApp(data);
        setEditForm({
          name: data.name,
          description: data.description ?? '',
          proposedDomain: data.proposedDomain ?? '',
          githubUrl: data.githubUrl ?? '',
          status: data.status
        });
      } else if (response.status === 404) {
        notFound();
      }
    } catch (error) {
      console.error('Failed to fetch app:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchApp();
    fetchUpdates();
    fetchDeployments();
  }, [fetchApp, fetchUpdates, fetchDeployments]);

  const handleFormChange =
    <T extends HTMLInputElement | HTMLTextAreaElement>(
      key: Exclude<keyof AppFormState, 'status'>,
      formatter?: (value: string) => string
    ): ChangeEventHandler<T> =>
    (event: ChangeEvent<T>) => {
      const value = formatter ? formatter(event.target.value) : event.target.value;
      setEditForm((current) => ({ ...current, [key]: value }));
    };

  const handleStatusChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    setEditForm((current) => ({
      ...current,
      status: event.target.value as AppStatus
    }));
  };

  const handleUpdateApp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`/api/apps/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedApp: AppDetails = await response.json();
        setApp(updatedApp);
        setIsEditing(false);
        toast.success('App updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update app:', error);
      toast.error('Failed to update app');
    }
  };

  const handleUpdateFormChange =
    <T extends HTMLInputElement | HTMLTextAreaElement>(
      key: Exclude<keyof UpdateFormState, 'period'>,
      transformer?: (value: string) => unknown
    ): ChangeEventHandler<T> =>
    (event: ChangeEvent<T>) => {
      const value = transformer ? transformer(event.target.value) : event.target.value;
      setUpdateForm((current) => ({ ...current, [key]: value }));
    };

  const handlePeriodChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    setUpdateForm((current) => ({
      ...current,
      period: event.target.value as Period
    }));
  };

  const handleAddUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`/api/apps/${slug}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...updateForm,
          tags: updateForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        setUpdateForm(createDefaultUpdateForm());
        setIsAddingUpdate(false);
        await fetchUpdates();
        toast.success('Update added successfully!');
      }
    } catch (error) {
      console.error('Failed to add update:', error);
      toast.error('Failed to add update');
    }
  };

  const handleEditUpdate = (update: Update) => {
    setEditingUpdate(update);
    setUpdateForm({
      progress: update.progress,
      summary: update.summary,
      blockers: update.blockers || '',
      tags: Array.isArray(update.tags) ? update.tags.join(', ') : '',
      period: update.period
    });
  };

  const handleUpdateUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUpdate) return;

    try {
      const response = await fetch(`/api/apps/${slug}/updates/${editingUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...updateForm,
          tags: updateForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        setEditingUpdate(null);
        setUpdateForm(createDefaultUpdateForm());
        await fetchUpdates();
        toast.success('Update updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update update:', error);
      toast.error('Failed to update update');
    }
  };

  const handleDeleteUpdate = async () => {
    if (!updateToDelete) return;

    try {
      const response = await fetch(`/api/apps/${slug}/updates/${updateToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUpdateToDelete(null);
        setDeleteDialogOpen(false);
        await fetchUpdates();
        toast.success('Update deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete update:', error);
      toast.error('Failed to delete update');
    }
  };

  const openDeleteDialog = (update: Update) => {
    setUpdateToDelete(update);
    setDeleteDialogOpen(true);
  };

  // Deployment handlers
  const handleDeploymentFormChange =
    <T extends HTMLInputElement | HTMLTextAreaElement>(
      key: Exclude<keyof DeploymentFormState, 'environment'>,
      transformer?: (value: string) => unknown
    ): ChangeEventHandler<T> =>
    (event: ChangeEvent<T>) => {
      const value = transformer ? transformer(event.target.value) : event.target.value;
      setDeploymentForm((current) => ({ ...current, [key]: value }));
    };

  const handleEnvironmentChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    setDeploymentForm((current) => ({
      ...current,
      environment: event.target.value as Environment
    }));
  };

  const handleAddDeployment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`/api/apps/${slug}/deployments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentForm)
      });

      if (response.ok) {
        setDeploymentForm(createDefaultDeploymentForm());
        setIsAddingDeployment(false);
        await fetchDeployments();
        toast.success('Deployment added successfully!');
      }
    } catch (error) {
      console.error('Failed to add deployment:', error);
      toast.error('Failed to add deployment');
    }
  };

  const handleEditDeployment = (deployment: Deployment) => {
    setEditingDeployment(deployment);
    setDeploymentForm({
      environment: deployment.environment,
      version: deployment.version,
      notes: deployment.notes || ''
    });
  };

  const handleUpdateDeployment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingDeployment) return;

    try {
      const response = await fetch(`/api/apps/${slug}/deployments/${editingDeployment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentForm)
      });

      if (response.ok) {
        setEditingDeployment(null);
        setDeploymentForm(createDefaultDeploymentForm());
        await fetchDeployments();
        toast.success('Deployment updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update deployment:', error);
      toast.error('Failed to update deployment');
    }
  };

  const handleDeleteDeployment = async () => {
    if (!deploymentToDelete) return;

    try {
      const response = await fetch(`/api/apps/${slug}/deployments/${deploymentToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeploymentToDelete(null);
        setDeleteDeploymentDialogOpen(false);
        await fetchDeployments();
        toast.success('Deployment deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete deployment:', error);
      toast.error('Failed to delete deployment');
    }
  };

  const openDeleteDeploymentDialog = (deployment: Deployment) => {
    setDeploymentToDelete(deployment);
    setDeleteDeploymentDialogOpen(true);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!app) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{app.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={getStatusBadgeClass(app.status)}>{app.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditing((current) => !current)}
            className="text-sm bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-800"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <Link href="/" className="text-sm hover:underline">
            Back
          </Link>
        </div>
      </header>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateApp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={handleFormChange('name')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => handleStatusChange({ target: { value } } as ChangeEvent<HTMLSelectElement>)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option[0] + option.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="proposedDomain">Proposed domain</Label>
                <Input
                  id="proposedDomain"
                  placeholder="https://..."
                  value={editForm.proposedDomain}
                  onChange={handleFormChange('proposedDomain')}
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/..."
                  value={editForm.githubUrl}
                  onChange={handleFormChange('githubUrl')}
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description"
                  value={editForm.description}
                  onChange={handleFormChange('description')}
                />
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {app.proposedDomain && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🌐</span>
                  <a
                    href={app.proposedDomain}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {app.proposedDomain.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {app.githubUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">⚡</span>
                  <a
                    href={app.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    GitHub
                  </a>
                </div>
              )}
            </div>
            {app.description && (
              <p className="text-gray-700">{app.description}</p>
            )}
            <div className="text-xs text-gray-500">
              Created {new Date(app.createdAt).toLocaleDateString()} • 
              Updated {new Date(app.updatedAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Progress Updates</h2>
          <Button onClick={() => setIsAddingUpdate(true)}>
            Add Update
          </Button>
        </div>

        {updates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No progress updates yet. Add your first update above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{update.period}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(update.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUpdate(update)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(update)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{update.progress}%</span>
                    </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Deployments Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Deployments</h2>
          <Button onClick={() => setIsAddingDeployment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deployment
          </Button>
        </div>

        {deployments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Rocket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No deployments yet. Track your first deployment above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Rocket className="h-4 w-4 text-slate-500" />
                      <Badge 
                        variant={deployment.environment === 'PROD' ? 'default' : 'secondary'}
                        className={deployment.environment === 'PROD' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                      >
                        {deployment.environment}
                      </Badge>
                      <span className="font-mono text-sm">{deployment.version}</span>
                      <span className="text-sm text-slate-500">
                        {new Date(deployment.deployedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDeployment(deployment)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDeploymentDialog(deployment)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {deployment.notes && (
                  <CardContent>
                    <p className="text-sm text-slate-700">{deployment.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {(isAddingUpdate || editingUpdate) && (
        <Dialog open={true} onOpenChange={() => {
          setIsAddingUpdate(false);
          setEditingUpdate(null);
          setUpdateForm(createDefaultUpdateForm());
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUpdate ? 'Edit Update' : 'Add Progress Update'}
              </DialogTitle>
              <DialogDescription>
                {editingUpdate ? 'Update the progress details below.' : 'Record your latest progress on this application.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingUpdate ? handleUpdateUpdate : handleAddUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={updateForm.progress}
                  onChange={handleUpdateFormChange('progress', parseInt)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select value={updateForm.period} onValueChange={(value) => handlePeriodChange({ target: { value } } as ChangeEvent<HTMLSelectElement>)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option[0] + option.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="What did you accomplish?"
                  value={updateForm.summary}
                  onChange={handleUpdateFormChange('summary')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockers">Blockers</Label>
                <Textarea
                  id="blockers"
                  placeholder="Anything preventing progress?"
                  value={updateForm.blockers}
                  onChange={handleUpdateFormChange('blockers')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="frontend, backend, testing (comma separated)"
                  value={updateForm.tags}
                  onChange={handleUpdateFormChange('tags')}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingUpdate(false);
                    setEditingUpdate(null);
                    setUpdateForm(createDefaultUpdateForm());
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUpdate ? 'Update' : 'Add'} Update
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this update from {new Date(updateToDelete?.date || '').toLocaleDateString()}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUpdate}>
              Delete Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deployment Dialogs */}
      {(isAddingDeployment || editingDeployment) && (
        <Dialog open={true} onOpenChange={() => {
          setIsAddingDeployment(false);
          setEditingDeployment(null);
          setDeploymentForm(createDefaultDeploymentForm());
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDeployment ? 'Edit Deployment' : 'Add Deployment'}
              </DialogTitle>
              <DialogDescription>
                {editingDeployment ? 'Update the deployment details below.' : 'Record a new deployment for this application.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingDeployment ? handleUpdateDeployment : handleAddDeployment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select value={deploymentForm.environment} onValueChange={(value) => handleEnvironmentChange({ target: { value } } as ChangeEvent<HTMLSelectElement>)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {environmentOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option[0] + option.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  placeholder="v1.0.0, 2024.01.15, etc."
                  value={deploymentForm.version}
                  onChange={handleDeploymentFormChange('version')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployment-notes">Notes</Label>
                <Textarea
                  id="deployment-notes"
                  placeholder="Any notes about this deployment..."
                  value={deploymentForm.notes}
                  onChange={handleDeploymentFormChange('notes')}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingDeployment(false);
                    setEditingDeployment(null);
                    setDeploymentForm(createDefaultDeploymentForm());
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDeployment ? 'Update' : 'Add'} Deployment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={deleteDeploymentDialogOpen} onOpenChange={setDeleteDeploymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the {deploymentToDelete?.environment} deployment version {deploymentToDelete?.version}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDeploymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDeployment}>
              Delete Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

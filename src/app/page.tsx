'use client';

import Link from 'next/link';
import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  type ChangeEventHandler
} from 'react';
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
import { toast } from 'sonner';
import type { AppStatus } from '@/generated/prisma';
import { getStatusBadgeClass } from '@/lib/status';

interface AuthCheckResponse {
  authenticated: boolean;
}

interface LoginResponse {
  success: boolean;
  error?: string;
}

interface AppSummary {
  id: string;
  name: string;
  slug: string;
  status: AppStatus;
  proposedDomain: string | null;
  githubUrl: string | null;
}

interface AppFormState {
  name: string;
  description: string;
  proposedDomain: string;
  githubUrl: string;
  status: AppStatus;
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

const createDefaultFormState = (): AppFormState => ({
  name: '',
  description: '',
  proposedDomain: '',
  githubUrl: '',
  status: 'PLANNING'
});

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [appForm, setAppForm] = useState<AppFormState>(createDefaultFormState());
  const [editingApp, setEditingApp] = useState<AppSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<AppSummary | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const response = await fetch('/api/apps');

      if (!response.ok) {
        console.error('Apps request failed with status', response.status);
        return;
      }

      const data: AppSummary[] = await response.json();
      setApps(data);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data: AuthCheckResponse = await response.json();
      setIsAuthenticated(data.authenticated);

      if (data.authenticated) {
        await fetchApps();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchApps]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleAuthFormChange =
    (setter: (value: string) => void): ChangeEventHandler<HTMLInputElement> =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
    };

  const handleAppFormChange =
    <T extends HTMLInputElement | HTMLTextAreaElement>(
      key: Exclude<keyof AppFormState, 'status'>,
      transform?: (value: string) => string
    ): ChangeEventHandler<T> =>
    (event: ChangeEvent<T>) => {
      const value = transform ? transform(event.target.value) : event.target.value;
      setAppForm((current) => ({ ...current, [key]: value }));
    };

  const handleStatusChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    setAppForm((current) => ({
      ...current,
      status: event.target.value as AppStatus
    }));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data: LoginResponse = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        await fetchApps();
      } else {
        setLoginError(data.error ?? 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setApps([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAddApp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appForm)
      });

      if (response.ok) {
        setAppForm(createDefaultFormState());
        await fetchApps();
        toast.success('App created successfully!');
      }
    } catch (error) {
      console.error('Failed to add app:', error);
      toast.error('Failed to create app');
    }
  };

  const handleEditApp = (app: AppSummary) => {
    setEditingApp(app);
    setAppForm({
      name: app.name,
      description: '',
      proposedDomain: app.proposedDomain || '',
      githubUrl: app.githubUrl || '',
      status: app.status
    });
  };

  const handleUpdateApp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingApp) return;

    try {
      const response = await fetch(`/api/apps/${editingApp.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appForm)
      });

      if (response.ok) {
        setEditingApp(null);
        setAppForm(createDefaultFormState());
        await fetchApps();
        toast.success('App updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update app:', error);
      toast.error('Failed to update app');
    }
  };

  const handleDeleteApp = async () => {
    if (!appToDelete) return;

    try {
      const response = await fetch(`/api/apps/${appToDelete.slug}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAppToDelete(null);
        setDeleteDialogOpen(false);
        await fetchApps();
        toast.success('App deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete app:', error);
      toast.error('Failed to delete app');
    }
  };

  const openDeleteDialog = (app: AppSummary) => {
    setAppToDelete(app);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6 space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-5xl p-6 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">AppTracker</h1>
        </header>

        <main className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 w-full max-w-md">
            <h2 className="text-xl font-medium">Welcome to AppTracker</h2>
            <p className="text-gray-600">Please sign in to manage your applications</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={handleAuthFormChange(setUsername)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={handleAuthFormChange(setPassword)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
              <button
                type="submit"
                className="w-full px-6 py-3 rounded bg-gray-900 text-white hover:bg-gray-800"
              >
                Sign In
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AppTracker</h1>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:underline">
          Sign out
        </button>
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">
          {editingApp ? 'Edit application' : 'Create new application'}
        </h2>
        <form onSubmit={editingApp ? handleUpdateApp : handleAddApp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Name"
              value={appForm.name}
              onChange={handleAppFormChange('name')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" value={appForm.status} onValueChange={(value) => handleStatusChange({ target: { value } } as ChangeEvent<HTMLSelectElement>)}>
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
              name="proposedDomain"
              placeholder="https://..."
              value={appForm.proposedDomain}
              onChange={handleAppFormChange('proposedDomain')}
            />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              placeholder="https://github.com/..."
              value={appForm.githubUrl}
              onChange={handleAppFormChange('githubUrl')}
            />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Description"
              value={appForm.description}
              onChange={handleAppFormChange('description')}
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end space-x-2">
            {editingApp && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingApp(null);
                  setAppForm(createDefaultFormState());
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit">
              {editingApp ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Your apps</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-600">No apps yet.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apps.map((app) => (
              <li key={app.id} className="border rounded p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/apps/${app.slug}`} className="font-medium hover:underline">
                    {app.name}
                  </Link>
                  <span className={getStatusBadgeClass(app.status)}>{app.status}</span>
                </div>
                {app.proposedDomain && (
                  <div className="text-xs text-gray-600 mt-1">{app.proposedDomain}</div>
                )}
                {app.githubUrl && (
                  <a
                    href={app.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    GitHub
                  </a>
                )}
                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditApp(app)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(app)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{appToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteApp}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

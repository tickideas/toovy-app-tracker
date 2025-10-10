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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { toast } from 'sonner';
import type { AppStatus } from '@/generated/prisma';
import { getStatusBadgeClass } from '@/lib/status';
import { Plus, Search, Edit2, Trash2, ExternalLink, Github, LogOut, BarChart3, Package, Clock, Zap } from 'lucide-react';

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
  description?: string | null;
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
  const [filteredApps, setFilteredApps] = useState<AppSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [appForm, setAppForm] = useState<AppFormState>(createDefaultFormState());
  const [editingApp, setEditingApp] = useState<AppSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<AppSummary | null>(null);
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AppStatus | 'ALL'>('ALL');

  const filterAndSortApps = useCallback((appsList: AppSummary[], query: string, sortKey: 'name' | 'status' | 'updatedAt', order: 'asc' | 'desc', status: AppStatus | 'ALL') => {
    const filtered = appsList.filter(app => 
      (status === 'ALL' || app.status === status) &&
      (app.name.toLowerCase().includes(query.toLowerCase()) ||
       app.description?.toLowerCase().includes(query.toLowerCase()) ||
       app.proposedDomain?.toLowerCase().includes(query.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, []);

  const fetchApps = useCallback(async () => {
    try {
      const response = await fetch('/api/apps');

      if (!response.ok) {
        console.error('Apps request failed with status', response.status);
        return;
      }

      const data: AppSummary[] = await response.json();
      setApps(data);
      setFilteredApps(filterAndSortApps(data, searchQuery, sortBy, sortOrder, statusFilter));
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    }
  }, [searchQuery, sortBy, sortOrder, statusFilter, filterAndSortApps]);

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

  useEffect(() => {
    setFilteredApps(filterAndSortApps(apps, searchQuery, sortBy, sortOrder, statusFilter));
  }, [apps, searchQuery, sortBy, sortOrder, statusFilter, filterAndSortApps]);

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
        setCreateEditModalOpen(false);
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
      description: app.description || '',
      proposedDomain: app.proposedDomain || '',
      githubUrl: app.githubUrl || '',
      status: app.status
    });
    setCreateEditModalOpen(true);
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
        setCreateEditModalOpen(false);
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

  const handleOpenCreateModal = () => {
    setEditingApp(null);
    setAppForm(createDefaultFormState());
    setCreateEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setCreateEditModalOpen(false);
    setEditingApp(null);
    setAppForm(createDefaultFormState());
  };

  const getAppStats = () => {
    const stats = apps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<AppStatus, number>);
    return stats;
  };

  const getStatusOptions = (): (AppStatus | 'ALL')[] => ['ALL', ...statusOptions];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-7xl p-6 space-y-8">
        {/* Enhanced Header */}
        <header className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AppTracker</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage your application portfolio</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Apps</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{apps.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Live</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{getAppStats().LIVE || 0}</p>
                </div>
                <Zap className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {(getAppStats().BUILDING || 0) + (getAppStats().TESTING || 0) + (getAppStats().DEPLOYING || 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Ideas</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{getAppStats().IDEA || 0}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Add New App Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Add New App
            </Button>
          </div>
        </header>

      {/* Enhanced Search and Filter Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Apps</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {filteredApps.length} of {apps.length} apps
              </p>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {getStatusOptions().map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <SearchInput
                  placeholder="Search apps by name, description, or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onSearch={setSearchQuery}
                  className="pl-10 h-12 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'status' | 'updatedAt')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="updatedAt">Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">A-Z</SelectItem>
                  <SelectItem value="desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

      {/* App Grid or Empty State */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {filteredApps.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-slate-400" />
              </div>
              {apps.length === 0 ? (
                <>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No apps yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Start by creating your first application to track its progress and manage its lifecycle.
                  </p>
                  <Button onClick={handleOpenCreateModal} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First App
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No apps found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Try adjusting your search or filters to find what you&apos;re looking for.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <Card key={app.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1 group-hover:text-blue-600 transition-colors">
                        <Link href={`/apps/${app.slug}`} className="hover:underline block truncate">
                          {app.name}
                        </Link>
                      </CardTitle>
                      {app.description && (
                        <CardDescription className="line-clamp-2 text-sm">
                          {app.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge className={`ml-2 flex-shrink-0 ${getStatusBadgeClass(app.status)}`}>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {app.proposedDomain && (
                      <a
                        href={app.proposedDomain}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">
                          {app.proposedDomain.replace(/^https?:\/\//, '')}
                        </span>
                      </a>
                    )}
                    {app.githubUrl && (
                      <a
                        href={app.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                      >
                        <Github className="h-3 w-3" />
                        <span>Code</span>
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500">
                      Updated {new Date(app.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditApp(app)}
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(app)}
                        className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </section>

      {/* Create/Edit Modal */}
      <Dialog open={createEditModalOpen} onOpenChange={setCreateEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingApp ? 'Edit Application' : 'Create New Application'}
            </DialogTitle>
            <DialogDescription>
              {editingApp 
                ? 'Update the details and status of your application.'
                : 'Add a new application to track its progress and manage its lifecycle.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingApp ? handleUpdateApp : handleAddApp} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter app name"
                  value={appForm.name}
                  onChange={handleAppFormChange('name')}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select 
                  name="status" 
                  value={appForm.status} 
                  onValueChange={(value: AppStatus) => setAppForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-11">
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your application and its purpose..."
                value={appForm.description}
                onChange={handleAppFormChange('description')}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="proposedDomain" className="text-sm font-medium">Proposed Domain</Label>
                <Input
                  id="proposedDomain"
                  name="proposedDomain"
                  placeholder="https://example.com"
                  value={appForm.proposedDomain}
                  onChange={handleAppFormChange('proposedDomain')}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="text-sm font-medium">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  placeholder="https://github.com/user/repo"
                  value={appForm.githubUrl}
                  onChange={handleAppFormChange('githubUrl')}
                  className="h-11"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                className="flex-1 md:flex-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {editingApp ? 'Update Application' : 'Create Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}

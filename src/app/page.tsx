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
import type { AppStatus, Period } from '@/generated/prisma';
import { getStatusBadgeClass } from '@/lib/status';
import { Plus, Search, Edit2, Trash2, ExternalLink, Github, LogOut, BarChart3, Package, Clock, Zap, Filter, Target, Eye, EyeOff, Lock, Sparkles, ArrowRight, User, Shield, Zap as ZapIcon } from 'lucide-react';

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

interface AppStats {
  id: string;
  name: string;
  slug: string;
  status: AppStatus;
  completionPercentage: number;
  blockerCount: number;
  lastUpdateDate: string | null;
  updateCount: number;
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [appForm, setAppForm] = useState<AppFormState>(createDefaultFormState());
  const [editingApp, setEditingApp] = useState<AppSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<AppSummary | null>(null);
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AppStatus | 'ALL'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<Period | 'ALL'>('ALL');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [appStats, setAppStats] = useState<AppStats[]>([]);

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

  const fetchAppStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (periodFilter !== 'ALL') params.append('period', periodFilter);
      if (dateRangeStart) params.append('startDate', dateRangeStart);
      if (dateRangeEnd) params.append('endDate', dateRangeEnd);
      
      const response = await fetch(`/api/apps/stats?${params.toString()}`);

      if (!response.ok) {
        console.error('App stats request failed with status', response.status);
        return;
      }

      const data: AppStats[] = await response.json();
      setAppStats(data);
    } catch (error) {
      console.error('Failed to fetch app stats:', error);
    }
  }, [periodFilter, dateRangeStart, dateRangeEnd]);

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
      await fetchAppStats();
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    }
  }, [searchQuery, sortBy, sortOrder, statusFilter, filterAndSortApps, fetchAppStats]);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppStats();
    }
  }, [periodFilter, dateRangeStart, dateRangeEnd, isAuthenticated, fetchAppStats]);

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
    setIsLoadingLogin(true);

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
        toast.success('Welcome back! 🎉');
        await fetchApps();
      } else {
        setLoginError(data.error ?? 'Login failed');
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Login failed');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoadingLogin(false);
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-emerald-300/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
          <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full animate-ping delay-300" />
          <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-ping delay-700" />
          <div className="absolute top-1/3 right-20 w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-1000" />
        </div>

        {/* Main Content */}
        <div className="relative min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-6xl mx-auto">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/20 overflow-hidden">
              <div className="grid lg:grid-cols-2 min-h-[600px]">
                
                {/* Left Side - Branding & Visual */}
                <div className="relative bg-gradient-to-br from-blue-600 via-emerald-500 to-blue-700 p-12 flex flex-col justify-between text-white">
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Sparkles className="h-8 w-8" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">AppTracker</h1>
                        <p className="text-blue-100 text-sm">Application Lifecycle Management</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-4xl font-bold leading-tight">
                        Welcome Back to Your Project Hub
                      </h2>
                      <p className="text-blue-100 text-lg leading-relaxed">
                        Track, manage, and celebrate your application development journey. From idea to deployment, we&apos;ve got you covered.
                      </p>
                    </div>

                    <div className="mt-12 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Shield className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Secure & Private</h3>
                          <p className="text-blue-100 text-sm">Your data is encrypted and secure</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <ZapIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Lightning Fast</h3>
                          <p className="text-blue-100 text-sm">Built for performance and speed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                  <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                </div>

                {/* Right Side - Login Form */}
                <div className="p-12 flex flex-col justify-center">
                  <div className="max-w-md mx-auto w-full space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In</h3>
                      <p className="text-slate-600 dark:text-slate-400">Enter your credentials to access your apps</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                      {/* Username Input */}
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Username
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={handleAuthFormChange(setUsername)}
                            className="pl-11 h-12 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={handleAuthFormChange(setPassword)}
                            className="pl-11 pr-11 h-12 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                          Forgot password?
                        </a>
                      </div>

                      {/* Error Message */}
                      {loginError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                          {loginError}
                        </div>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoadingLogin}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white font-medium rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                      >
                        {isLoadingLogin ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Signing in...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            Sign In
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        )}
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
                      </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-12 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                      >
                        <Github className="h-5 w-5 mr-2" />
                        GitHub
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                      >
                        <div className="w-5 h-5 mr-2 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        Google
                      </Button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Don&apos;t have an account?{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                          Sign up
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-7xl p-6 space-y-8">
        {/* Enhanced Header */}
        <header className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                  <rect width="32" height="32" rx="8" fill="#0F172A"/>
                  <path d="M8 12C8 10.8954 8.89543 10 10 10H22C23.1046 10 24 10.8954 24 12V20C24 21.1046 23.1046 22 22 22H10C8.89543 22 8 21.1046 8 20V12Z" fill="#1E293B"/>
                  <path d="M12 14H20M12 17H17" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="10" r="2" fill="#10B981"/>
                  <circle cx="22" cy="10" r="2" fill="#F59E0B"/>
                  <circle cx="10" cy="22" r="2" fill="#EF4444"/>
                  <circle cx="22" cy="22" r="2" fill="#8B5CF6"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AppTracker</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage your application portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/roadmap">
                <Button variant="outline" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Roadmap
                </Button>
              </Link>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Apps</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{apps.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Live</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{getAppStats().LIVE || 0}</p>
                </div>
                <Zap className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg p-4">
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
            <div className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 rounded-lg p-4">
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
              className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
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
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period-filter" className="text-sm">Update Period</Label>
                  <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as Period | 'ALL')}>
                    <SelectTrigger id="period-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Periods</SelectItem>
                      {periodOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option[0] + option.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-start" className="text-sm">Start Date</Label>
                  <Input
                    id="date-start"
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-end" className="text-sm">End Date</Label>
                  <Input
                    id="date-end"
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPeriodFilter('ALL');
                    setDateRangeStart('');
                    setDateRangeEnd('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
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
                  <Button onClick={handleOpenCreateModal} className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600">
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
                  
                  {/* Quick Stats */}
                  {(() => {
                    const stats = appStats.find(s => s.id === app.id);
                    if (!stats) return null;
                    
                    return (
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Progress</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  stats.completionPercentage >= 80 ? 'bg-green-500' :
                                  stats.completionPercentage >= 50 ? 'bg-yellow-500' :
                                  stats.completionPercentage >= 20 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${stats.completionPercentage}%` }}
                              />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {stats.completionPercentage}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Updates</span>
                          <span className="text-slate-700 dark:text-slate-300">{stats.updateCount}</span>
                        </div>
                        {stats.blockerCount > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Blockers</span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              {stats.blockerCount}
                            </span>
                          </div>
                        )}
                        {stats.lastUpdateDate && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Last Update</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {new Date(stats.lastUpdateDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
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
                className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600"
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

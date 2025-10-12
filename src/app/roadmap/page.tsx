'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import type { AppStatus } from '@/generated/prisma';
import { getStatusBadgeClass } from '@/lib/status';
import { Calendar, Clock, Target, TrendingUp, Filter, BarChart3 } from 'lucide-react';

interface AuthCheckResponse {
  authenticated: boolean;
}

interface RoadmapApp {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: AppStatus;
  proposedDomain: string | null;
  githubUrl: string | null;
  createdAt: string;
  updatedAt: string;
  completionPercentage: number;
  updateCount: number;
  blockerCount: number;
  lastUpdateDate: string | null;
  recentUpdates: {
    id: string;
    date: string;
    progress: number;
    summary: string;
    period: string;
  }[];
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



export default function RoadmapPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState<RoadmapApp[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'metrics'>('timeline');

  const fetchRoadmapData = useCallback(async () => {
    try {
      const response = await fetch('/api/apps/roadmap');
      if (!response.ok) {
        console.error('Roadmap data request failed');
        return;
      }
      const data: RoadmapApp[] = await response.json();
      setApps(data);
    } catch (error) {
      console.error('Failed to fetch roadmap data:', error);
      toast.error('Failed to load roadmap data');
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data: AuthCheckResponse = await response.json();
      setIsAuthenticated(data.authenticated);

      if (data.authenticated) {
        await fetchRoadmapData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRoadmapData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [apps, searchQuery, statusFilter]);

  const getAppsByStatus = useMemo(() => {
    const grouped: Record<AppStatus, RoadmapApp[]> = {
      'IDEA': [],
      'PLANNING': [],
      'BUILDING': [],
      'TESTING': [],
      'DEPLOYING': [],
      'LIVE': [],
      'PAUSED': [],
      'ARCHIVED': []
    };

    filteredApps.forEach(app => {
      grouped[app.status].push(app);
    });

    return grouped;
  }, [filteredApps]);

  const getOverallMetrics = useMemo(() => {
    const total = apps.length;
    const live = apps.filter(app => app.status === 'LIVE').length;
    const inProgress = apps.filter(app => ['BUILDING', 'TESTING', 'DEPLOYING'].includes(app.status)).length;
    const avgCompletion = apps.length > 0 
      ? Math.round(apps.reduce((sum, app) => sum + app.completionPercentage, 0) / apps.length)
      : 0;
    const totalBlockers = apps.reduce((sum, app) => sum + app.blockerCount, 0);

    return { total, live, inProgress, avgCompletion, totalBlockers };
  }, [apps]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div>Loading roadmap...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold mb-4">Roadmap</h1>
          <p className="text-gray-600">Please sign in to view the roadmap.</p>
        </div>
      </div>
    );
  }

  const metrics = getOverallMetrics;
  const appsByStatus = getAppsByStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-7xl p-6 space-y-8">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Roadmap</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Track progress across all applications</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Apps</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{metrics.total}</p>
                </div>
                <BarChart3 className="h-6 w-6 text-blue-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Live</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{metrics.live}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{metrics.inProgress}</p>
                </div>
                <Clock className="h-6 w-6 text-yellow-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Avg Progress</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{metrics.avgCompletion}%</p>
                </div>
                <Target className="h-6 w-6 text-purple-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Blockers</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{metrics.totalBlockers}</p>
                </div>
                <Filter className="h-6 w-6 text-red-500 opacity-50" />
              </div>
            </div>
          </div>
        </header>

        {/* Controls */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppStatus | 'ALL')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'timeline' | 'kanban' | 'metrics')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="kanban">Kanban</SelectItem>
                  <SelectItem value="metrics">Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {filteredApps.length === 0 ? (
            <div className="text-center py-16">
              <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No apps found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your search or filters to find applications.
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'timeline' && (
                <div className="space-y-8">
                  {statusOptions.map((status) => {
                    const statusApps = appsByStatus[status];
                    if (statusApps.length === 0) return null;

                    return (
                      <div key={status} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Badge className={`${getStatusBadgeClass(status)} text-sm px-3 py-1`}>
                            {status}
                          </Badge>
                          <span className="text-sm text-slate-500">{statusApps.length} app{statusApps.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-4">
                          {statusApps.map((app) => (
                            <Card key={app.id} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg mb-1">
                                      <Link href={`/apps/${app.slug}`} className="hover:text-blue-600 transition-colors">
                                        {app.name}
                                      </Link>
                                    </CardTitle>
                                    {app.description && (
                                      <CardDescription>{app.description}</CardDescription>
                                    )}
                                  </div>
                                  <Badge className={getStatusBadgeClass(app.status)}>
                                    {app.completionPercentage}%
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Progress</span>
                                    <span className="font-medium">{app.completionPercentage}%</span>
                                  </div>
                                  <Progress value={app.completionPercentage} className="h-2" />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="text-center">
                                    <p className="text-slate-500">Updates</p>
                                    <p className="font-semibold">{app.updateCount}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-slate-500">Blockers</p>
                                    <p className="font-semibold text-orange-600">{app.blockerCount}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-slate-500">Last Update</p>
                                    <p className="font-semibold">
                                      {app.lastUpdateDate ? new Date(app.lastUpdateDate).toLocaleDateString() : 'Never'}
                                    </p>
                                  </div>
                                </div>

                                {app.recentUpdates.length > 0 && (
                                  <div className="border-t pt-3">
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">Recent Updates</h4>
                                    <div className="space-y-2">
                                      {app.recentUpdates.slice(0, 3).map((update) => (
                                        <div key={update.id} className="flex items-start gap-2 text-sm">
                                          <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-600">
                                                {new Date(update.date).toLocaleDateString()}
                                              </span>
                                              <span className="text-slate-400">•</span>
                                              <span className="font-medium">{update.progress}%</span>
                                            </div>
                                            <p className="text-slate-700 mt-1">{update.summary}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statusOptions.map((status) => {
                    const statusApps = appsByStatus[status];
                    return (
                      <div key={status} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusBadgeClass(status)} text-sm`}>
                            {status}
                          </Badge>
                          <span className="text-sm text-slate-500">({statusApps.length})</span>
                        </div>
                        <div className="space-y-3">
                          {statusApps.map((app) => (
                            <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                  <Link href={`/apps/${app.slug}`} className="hover:text-blue-600">
                                    {app.name}
                                  </Link>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <Progress value={app.completionPercentage} className="h-1 mb-2" />
                                <div className="flex items-center justify-between text-xs text-slate-600">
                                  <span>{app.completionPercentage}%</span>
                                  <span>{app.updateCount} updates</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === 'metrics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredApps.map((app) => (
                      <Card key={app.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            <Link href={`/apps/${app.slug}`} className="hover:text-blue-600">
                              {app.name}
                            </Link>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeClass(app.status)}>
                              {app.status}
                            </Badge>
                            <Badge variant="outline">
                              {app.completionPercentage}% Complete
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Progress value={app.completionPercentage} className="h-3" />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Total Updates</p>
                              <p className="font-semibold">{app.updateCount}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Active Blockers</p>
                              <p className="font-semibold text-orange-600">{app.blockerCount}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Created</p>
                              <p className="font-semibold">{new Date(app.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Last Updated</p>
                              <p className="font-semibold">
                                {app.lastUpdateDate ? new Date(app.lastUpdateDate).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

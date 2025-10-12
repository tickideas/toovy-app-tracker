'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Edit2, Trash2, Github } from 'lucide-react';
import type { AppStatus } from '@/generated/prisma';
import { getStatusBadgeClass } from '@/lib/status';

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

interface AppListProps {
  apps: AppSummary[];
  searchQuery: string;
  statusFilter: AppStatus | 'ALL';
  onEdit: (app: AppSummary) => void;
  onDelete: (app: AppSummary) => void;
}

export default function AppList({ 
  apps, 
  searchQuery, 
  statusFilter, 
  onEdit, 
  onDelete 
}: AppListProps) {
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.proposedDomain?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [apps, searchQuery, statusFilter]);

  if (filteredApps.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <ExternalLink className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No applications found
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Try adjusting your search or filters, or create your first application.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredApps.map((app) => (
        <Card key={app.id} className="group hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-1 truncate">
                  <Link 
                    href={`/apps/${app.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {app.name}
                  </Link>
                </CardTitle>
                {app.description && (
                  <CardDescription className="line-clamp-2">
                    {app.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge className={getStatusBadgeClass(app.status)}>
                  {app.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {app.proposedDomain && (
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={`https://${app.proposedDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {app.proposedDomain}
                    </a>
                  </div>
                )}
                {app.githubUrl && (
                  <div className="flex items-center gap-1">
                    <Github className="h-4 w-4" />
                    <a 
                      href={app.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      GitHub
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(app)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(app)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-500">
              Created: {new Date(app.createdAt).toLocaleDateString()} • 
              Updated: {new Date(app.updatedAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

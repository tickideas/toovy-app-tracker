'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package, Clock, Target, TrendingUp } from 'lucide-react';
import type { AppStatus } from '@/generated/prisma';

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

interface AppStatisticsProps {
  apps: AppStats[];
}

export default function AppStatistics({ apps }: AppStatisticsProps) {
  const totalApps = apps.length;
  const liveApps = apps.filter(app => app.status === 'LIVE').length;
  const inProgressApps = apps.filter(app => 
    ['BUILDING', 'TESTING', 'DEPLOYING'].includes(app.status)
  ).length;

  const totalBlockers = apps.reduce((sum, app) => sum + app.blockerCount, 0);

  const getStatusColor = (type: 'success' | 'warning' | 'info' | 'danger') => {
    const colors = {
      success: `from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20`,
      warning: `from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20`,
      info: `from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20`,
      danger: `from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20`,
    };
    return colors[type];
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className={`bg-gradient-to-r ${getStatusColor('info')}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Apps</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalApps}</p>
            </div>
            <Package className="h-6 w-6 text-blue-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-r ${getStatusColor('success')}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Live Apps</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{liveApps}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-r ${getStatusColor('warning')}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{inProgressApps}</p>
            </div>
            <Clock className="h-6 w-6 text-yellow-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-r ${getStatusColor('danger')}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Blockers</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{totalBlockers}</p>
            </div>
            <Target className="h-6 w-6 text-red-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

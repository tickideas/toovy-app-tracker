import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Period } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as Period | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const apps = await prisma.app.findMany({
      include: {
        updates: {
          where: {
            ...(period && { period }),
            ...(startDate && { date: { gte: new Date(startDate) } }),
            ...(endDate && { date: { lte: new Date(endDate) } }),
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    const appStats = apps.map(app => {
      const updates = app.updates;
      const latestUpdate = updates[0];
      const blockerCount = updates.filter(u => u.blockers && u.blockers.trim().length > 0).length;
      
      return {
        id: app.id,
        name: app.name,
        slug: app.slug,
        status: app.status,
        completionPercentage: latestUpdate?.progress || 0,
        blockerCount,
        lastUpdateDate: latestUpdate?.date.toISOString() || null,
        updateCount: updates.length,
      };
    });

    return NextResponse.json(appStats);
  } catch (error) {
    console.error('Failed to fetch app stats:', error);
    return NextResponse.json({ error: 'Failed to fetch app statistics' }, { status: 500 });
  }
}

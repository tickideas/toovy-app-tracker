import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await prisma.app.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        updates: {
          orderBy: {
            date: 'desc'
          },
          take: 5,
          select: {
            id: true,
            date: true,
            progress: true,
            summary: true,
            period: true
          }
        },
        _count: {
          select: {
            updates: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calculate completion percentage and blocker count for each app
    const roadmapApps = apps.map(app => {
      const completionPercentage = app.updates.length > 0
        ? Math.round(app.updates.reduce((sum, update) => sum + update.progress, 0) / app.updates.length)
        : 0;
      
      const blockerCount = app.updates.filter(update => update.summary.toLowerCase().includes('blocker')).length;
      
      const lastUpdateDate = app.updates.length > 0 ? app.updates[0].date : null;

      return {
        id: app.id,
        name: app.name,
        slug: app.slug,
        description: app.description,
        status: app.status,
        proposedDomain: app.proposedDomain,
        githubUrl: app.githubUrl,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        completionPercentage,
        updateCount: app._count.updates,
        blockerCount,
        lastUpdateDate: lastUpdateDate?.toISOString() || null,
        recentUpdates: app.updates.map(update => ({
          id: update.id,
          date: update.date.toISOString(),
          progress: update.progress,
          summary: update.summary,
          period: update.period
        }))
      };
    });

    return NextResponse.json(roadmapApps);
  } catch (error) {
    console.error('Roadmap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

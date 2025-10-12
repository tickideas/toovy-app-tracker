import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
  if (!authToken) return false;
  
  const user = verifyToken(authToken);
  return !!user;
}

async function getOrCreateUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'admin@local.dev',
        name: 'Admin User'
      }
    });
  }
  return user;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getOrCreateUser();
    const app = await prisma.app.findFirst({
      where: { slug, ownerId: user.id },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get all client tasks for this app via share links
    const tasks = await prisma.clientTask.findMany({
      where: {
        shareLink: {
          appId: app.id
        }
      },
      include: {
        shareLink: {
          select: {
            code: true,
            createdAt: true,
          }
        },
        completion: {
          select: {
            completedBy: true,
            completedAt: true,
            feedback: true,
            notes: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add task counts by status
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'PENDING').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      rejected: tasks.filter(t => t.status === 'REJECTED').length,
    };

    return NextResponse.json({
      tasks,
      stats: taskStats,
    });
  } catch (error) {
    console.error('Failed to fetch client tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch client tasks' }, { status: 500 });
  }
}

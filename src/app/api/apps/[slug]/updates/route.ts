import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { isAuthenticated } from '@/lib/auth-server';

const periods = ['DAY', 'WEEK', 'MONTH'] as const;

const updateSchema = z.object({
  progress: z.number().min(0).max(100),
  summary: z.string().min(1),
  blockers: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  period: z.enum(periods).default('WEEK'),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    
    const app = await prisma.app.findUnique({
      where: { slug },
      include: {
        updates: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json(app.updates);
  } catch (error) {
    console.error('Failed to fetch updates:', error);
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const app = await prisma.app.findUnique({
      where: { slug }
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get or create user (simplified for now)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'admin@local.dev', name: 'Admin User' }
      });
    }

    const update = await prisma.update.create({
      data: {
        appId: app.id,
        authorId: user.id,
        progress: data.progress,
        summary: data.summary,
        blockers: data.blockers,
        tags: data.tags,
        period: data.period,
        date: new Date(),
      }
    });

    return NextResponse.json(update);
  } catch (error) {
    console.error('Failed to create update:', error);
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
  }
}

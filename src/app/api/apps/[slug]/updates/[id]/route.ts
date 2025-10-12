import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  return authToken?.value === 'authenticated-user';
}

const updateUpdateSchema = z.object({
  progress: z.number().min(0).max(100),
  summary: z.string().min(1),
  blockers: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  period: z.enum(['DAY', 'WEEK', 'MONTH']).default('WEEK'),
});

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug, id } = await params;
    const body = await request.json();
    const data = updateUpdateSchema.parse(body);

    const app = await prisma.app.findUnique({
      where: { slug }
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const update = await prisma.update.findFirst({
      where: { 
        id,
        appId: app.id 
      }
    });

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    const updatedUpdate = await prisma.update.update({
      where: { id },
      data: {
        progress: data.progress,
        summary: data.summary,
        blockers: data.blockers,
        tags: data.tags,
        period: data.period,
      }
    });

    return NextResponse.json(updatedUpdate);
  } catch (error) {
    console.error('Failed to update update:', error);
    return NextResponse.json({ error: 'Failed to update update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug, id } = await params;

    const app = await prisma.app.findUnique({
      where: { slug }
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const update = await prisma.update.findFirst({
      where: { 
        id,
        appId: app.id 
      }
    });

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    await prisma.update.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete update:', error);
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
  }
}

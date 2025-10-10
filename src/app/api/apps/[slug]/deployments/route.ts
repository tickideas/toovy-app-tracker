import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Environment } from '@/generated/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const app = await prisma.app.findUnique({
      where: { slug },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const deployments = await prisma.deployment.findMany({
      where: { appId: app.id },
      orderBy: { deployedAt: 'desc' },
    });

    return NextResponse.json(deployments);
  } catch (error) {
    console.error('Failed to fetch deployments:', error);
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { environment, version, notes } = await request.json();

    const app = await prisma.app.findUnique({
      where: { slug },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const deployment = await prisma.deployment.create({
      data: {
        appId: app.id,
        environment: environment as Environment,
        version,
        notes,
      },
    });

    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Failed to create deployment:', error);
    return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 });
  }
}

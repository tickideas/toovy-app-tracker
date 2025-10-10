import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const { environment, version, notes } = await request.json();

    const app = await prisma.app.findUnique({
      where: { slug },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const deployment = await prisma.deployment.findFirst({
      where: { id, appId: app.id },
    });

    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    const updatedDeployment = await prisma.deployment.update({
      where: { id },
      data: {
        environment,
        version,
        notes,
      },
    });

    return NextResponse.json(updatedDeployment);
  } catch (error) {
    console.error('Failed to update deployment:', error);
    return NextResponse.json({ error: 'Failed to update deployment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

    const app = await prisma.app.findUnique({
      where: { slug },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const deployment = await prisma.deployment.findFirst({
      where: { id, appId: app.id },
    });

    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    await prisma.deployment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete deployment:', error);
    return NextResponse.json({ error: 'Failed to delete deployment' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { getRepoInsights } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    
    const app = await prisma.app.findFirst({
      where: {
        slug,
        ownerId: session.user.id,
        githubUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        githubUrl: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found or no GitHub URL configured' }, { status: 404 });
    }

    const insights = await getRepoInsights(app.githubUrl!);
    
    return NextResponse.json(insights);
  } catch (error) {
    console.error('GitHub insights API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

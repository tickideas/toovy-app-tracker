import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidShareCode } from '@/lib/share';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  try {
    // Validate share code format
    if (!isValidShareCode(code)) {
      return NextResponse.json({ error: 'Invalid share code format' }, { status: 400 });
    }

    // Find active share link and update analytics
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        code,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        app: {
          include: {
            updates: {
              orderBy: { date: 'desc' }
            },
            deployments: {
              orderBy: { deployedAt: 'desc' }
            },
            _count: {
              select: {
                updates: true,
                deployments: true,
              }
            }
          }
        }
      }
    });

    // Update access analytics
    if (shareLink) {
      await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 }
        }
      });
    }

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    // Return app data with permissions
    const { app, permissions, createdAt, expiresAt } = shareLink;
    
    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name,
        slug: app.slug,
        description: app.description,
        proposedDomain: app.proposedDomain,
        githubUrl: app.githubUrl,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        updates: app.updates,
        deployments: app.deployments,
        _count: app._count,
      },
      permissions,
      shareInfo: {
        createdAt,
        expiresAt,
      }
    });
  } catch (error) {
    console.error('Failed to fetch public app data:', error);
    return NextResponse.json({ error: 'Failed to fetch app data' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  return authToken?.value === 'authenticated';
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

// DELETE - Revoke a share link
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getOrCreateUser();
    
    // Find the share link and verify ownership
    const shareLink = await prisma.shareLink.findUnique({
      where: { code },
      include: {
        app: true
      }
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (shareLink.app.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the share link (this will cascade delete feedbacks and client tasks)
    await prisma.shareLink.delete({
      where: { code }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete share link:', error);
    return NextResponse.json({ error: 'Failed to delete share link' }, { status: 500 });
  }
}

// GET - Get share link details (for admin)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getOrCreateUser();
    
    const shareLink = await prisma.shareLink.findUnique({
      where: { code },
      include: {
        app: true,
        _count: {
          select: {
            feedbacks: true,
            clientTasks: true,
          }
        }
      }
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (shareLink.app.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(shareLink);
  } catch (error) {
    console.error('Failed to fetch share link:', error);
    return NextResponse.json({ error: 'Failed to fetch share link' }, { status: 500 });
  }
}

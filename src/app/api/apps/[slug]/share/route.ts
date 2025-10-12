import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { generateShareCode, DEFAULT_SHARE_PERMISSIONS, SHARE_PRESETS } from '@/lib/share';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
  if (!authToken) return false;
  
  const user = verifyToken(authToken);
  return !!user;
}

const shareLinkSchema = z.object({
  preset: z.enum(['view_only', 'can_comment', 'full_access']).optional(),
  customPermissions: z.object({
    view: z.boolean().default(true),
    comment: z.boolean().default(false),
    create_tasks: z.boolean().default(false),
  }).optional(),
  expiresAt: z.string().datetime().optional(),
});

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

// GET - List all share links for an app
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
      include: {
        shareLinks: {
          include: {
            _count: {
              select: {
                feedbacks: true,
                clientTasks: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json(app.shareLinks);
  } catch (error) {
    console.error('Failed to fetch share links:', error);
    return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 });
  }
}

// POST - Create a new share link
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = shareLinkSchema.parse(body);

    const user = await getOrCreateUser();
    const app = await prisma.app.findFirst({
      where: { slug, ownerId: user.id },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Generate unique share code
    let code = generateShareCode();
    let attempts = 0;
    while (await prisma.shareLink.findUnique({ where: { code } }) && attempts < 10) {
      code = generateShareCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Failed to generate unique share code' }, { status: 500 });
    }

    // Determine permissions
    let permissions;
    if (data.customPermissions) {
      permissions = data.customPermissions;
    } else if (data.preset) {
      permissions = SHARE_PRESETS[data.preset];
    } else {
      permissions = DEFAULT_SHARE_PERMISSIONS;
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        code,
        appId: app.id,
        permissions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        app: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    });

    return NextResponse.json(shareLink);
  } catch (error) {
    console.error('Failed to create share link:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

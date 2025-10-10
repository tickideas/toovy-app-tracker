import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from "zod";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  return authToken?.value === 'authenticated';
}

const statuses = [
  "IDEA",
  "PLANNING",
  "BUILDING",
  "TESTING",
  "DEPLOYING",
  "LIVE",
  "PAUSED",
  "ARCHIVED",
] as const;

const appSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  proposedDomain: z.string().refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid URL" }).optional().nullable(),
  githubUrl: z.string().refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid URL" }).optional().nullable(),
  status: z.enum(statuses),
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

    return NextResponse.json(app);
  } catch (error) {
    console.error('Failed to fetch app:', error);
    return NextResponse.json({ error: 'Failed to fetch app' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = appSchema.parse(body);

    const user = await getOrCreateUser();
    const app = await prisma.app.findFirst({
      where: { slug, ownerId: user.id },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const updatedApp = await prisma.app.update({
      where: { id: app.id },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        proposedDomain: data.proposedDomain?.trim() || undefined,
        githubUrl: data.githubUrl?.trim() || undefined,
        status: data.status,
      },
    });

    return NextResponse.json(updatedApp);
  } catch (error) {
    console.error('Failed to update app:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

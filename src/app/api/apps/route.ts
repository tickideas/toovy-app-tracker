import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from "zod";
import { isAuthenticated } from '@/lib/auth-server';

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
  status: z.enum(statuses).default("PLANNING"),
  client: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base: string) {
  let slug = base;
  let i = 1;
  // ensure uniqueness across all apps
  while (await prisma.app.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

async function getOrCreateUser() {
  // For simplicity, we'll use a hardcoded user ID or create one if it doesn't exist
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

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getOrCreateUser();

    const apps = await prisma.app.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(apps);
  } catch (error) {
    console.error('Failed to fetch apps:', error);
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = appSchema.parse(body);

    const user = await getOrCreateUser();
    const baseSlug = slugify(data.name);
    const slug = await uniqueSlug(baseSlug || "app");

    const app = await prisma.app.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
        proposedDomain: data.proposedDomain?.trim() || undefined,
        githubUrl: data.githubUrl?.trim() || undefined,
        status: data.status,
        client: data.client?.trim() || undefined,
        platform: data.platform?.trim() || undefined,
        slug,
        ownerId: user.id,
      },
    });

    return NextResponse.json(app);
  } catch (error) {
    console.error('Failed to create app:', error);
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
  }
}
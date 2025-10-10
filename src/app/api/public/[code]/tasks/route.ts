import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { isValidShareCode } from '@/lib/share';
import { rateLimit } from '@/lib/rate-limit';

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  clientName: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const rateLimitResult = rateLimit(`tasks:${code}:${ip}`, 3, 60 * 1000); // 3 tasks per minute per IP
    
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Too many task submissions. Please try again later.' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      });
    }

    // Validate share code format
    if (!isValidShareCode(code)) {
      return NextResponse.json({ error: 'Invalid share code format. Please check the link and try again.' }, { status: 400 });
    }

    // Validate request body
    const body = await request.json();
    const data = taskSchema.parse(body);

    // Find active share link with task creation permissions
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        code,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    const permissions = shareLink.permissions as { comment: boolean; view: boolean; create_tasks: boolean };
    if (!permissions.create_tasks) {
      return NextResponse.json({ error: 'Task creation not allowed for this share link' }, { status: 403 });
    }

    // Create client task
    const task = await prisma.clientTask.create({
      data: {
        shareCode: code,
        title: data.title,
        description: data.description,
        clientName: data.clientName || null,
        status: 'PENDING',
      },
      include: {
        shareLink: {
          select: {
            app: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      clientName: task.clientName,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      appName: task.shareLink.app.name,
    });
  } catch (error) {
    console.error('Failed to create task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// GET - List tasks for a share link
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

    // Find active share link
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        code,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    // Get tasks
    const tasks = await prisma.clientTask.findMany({
      where: { shareCode: code },
      include: {
        completion: {
          select: {
            completedBy: true,
            completedAt: true,
            feedback: true,
            notes: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

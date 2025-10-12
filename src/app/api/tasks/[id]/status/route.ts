import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  return authToken?.value === 'authenticated-user';
}

const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = statusUpdateSchema.parse(body);

    // Verify the task exists
    const task = await prisma.clientTask.findUnique({
      where: { id },
      include: {
        shareLink: {
          include: {
            app: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If marking as completed, we need completion details
    if (data.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Use /complete endpoint to mark tasks as completed with feedback' 
      }, { status: 400 });
    }

    const updatedTask = await prisma.clientTask.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        shareLink: {
          select: {
            code: true,
            app: {
              select: {
                name: true,
                slug: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}

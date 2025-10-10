import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  return authToken?.value === 'authenticated';
}

const completionSchema = z.object({
  completedBy: z.string().min(1),
  feedback: z.string().min(1).max(2000),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = completionSchema.parse(body);

    // Verify the task exists and get its current status
    const task = await prisma.clientTask.findUnique({
      where: { id },
      include: {
        completion: true,
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

    // Check if task is already completed
    if (task.completion) {
      return NextResponse.json({ error: 'Task is already completed' }, { status: 400 });
    }

    // Create task completion and update task status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create completion record
      await tx.taskCompletion.create({
        data: {
          taskId: id,
          completedBy: data.completedBy,
          feedback: data.feedback,
          notes: data.notes || null,
        }
      });

      // Update task status
      const updatedTask = await tx.clientTask.update({
        where: { id },
        data: {
          status: 'COMPLETED',
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
          },
          completion: {
            select: {
              completedBy: true,
              completedAt: true,
              feedback: true,
              notes: true,
            }
          }
        }
      });

      return updatedTask;
    });

    return NextResponse.json({
      ...result,
      message: 'Task marked as completed successfully'
    });
  } catch (error) {
    console.error('Failed to complete task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}

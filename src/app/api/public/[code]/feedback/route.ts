import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { isValidShareCode } from '@/lib/share';
import { rateLimit } from '@/lib/rate-limit';

const feedbackSchema = z.object({
  clientName: z.string().optional(),
  message: z.string().min(1).max(2000),
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
    const rateLimitResult = rateLimit(`feedback:${code}:${ip}`, 5, 60 * 1000); // 5 feedbacks per minute per IP
    
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Too many feedback submissions. Please try again later.' 
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
    const data = feedbackSchema.parse(body);

    // Find active share link with comment permissions
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
    if (!permissions.comment) {
      return NextResponse.json({ error: 'Comments not allowed for this share link' }, { status: 403 });
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        shareCode: code,
        clientName: data.clientName || null,
        message: data.message,
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
      id: feedback.id,
      message: feedback.message,
      clientName: feedback.clientName,
      createdAt: feedback.createdAt,
      appName: feedback.shareLink.app.name,
    });
  } catch (error) {
    console.error('Failed to create feedback:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
  }
}

// GET - List feedback for a share link
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

    const permissions = shareLink.permissions as { comment: boolean; view: boolean; create_tasks: boolean };
    if (!permissions.comment) {
      return NextResponse.json({ error: 'Comments not enabled for this share link' }, { status: 403 });
    }

    // Get feedback
    const feedbacks = await prisma.feedback.findMany({
      where: { shareCode: code },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientName: true,
        message: true,
        createdAt: true,
      }
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getRepoInsights, getGitHubTokenForRepo } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get user from custom JWT authentication
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    let user = null;
    if (authToken) {
      user = verifyToken(authToken);
    }
    
    // First, try to find the app owned by the authenticated user
    let app = null;
    let isOwner = false;
    
    if (user?.userId) {
      app = await prisma.app.findFirst({
        where: {
          slug,
          ownerId: user.userId,
          githubUrl: {
            not: null,
          },
        },
        select: {
          id: true,
          githubUrl: true,
        },
      });
      
      if (app) {
        isOwner = true;
      }
    }
    
    // If not found as owner, don't fall back to public access for security
    if (!app) {
      return NextResponse.json({ error: 'App not found or access denied' }, { status: 404 });
    }

    // Get insights with proper authentication for private repos
    const insights = await getRepoInsights(app.githubUrl!, {
      isOwner,
      hasValidToken: !!getGitHubTokenForRepo(app.githubUrl!)
    });
    
    // If repo is private and user is not the owner, block access
    if (insights.repo?.private && !isOwner) {
      return NextResponse.json({ 
        error: 'Access denied: This is a private repository' 
      }, { status: 403 });
    }
    
    // If repo data is null but we have an error about privacy, show appropriate message
    if (!insights.repo && insights.error?.includes('404')) {
      return NextResponse.json({
        ...insights,
        error: 'Repository not found or private. If this is your private repo, ensure GitHub token is configured.'
      });
    }
    
    return NextResponse.json(insights);
  } catch (error) {
    console.error('GitHub insights API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

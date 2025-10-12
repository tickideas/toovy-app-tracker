import { NextResponse } from 'next/server';
import { analyzeGitHubTokenConfig, getTokenForRepoExample } from '@/lib/github-tokens';
import { getGitHubTokenForRepo } from '@/lib/github';

// This endpoint is for debugging token configuration only
// Remove authentication in development, but be careful in production!

export async function GET() {
  try {
    const config = analyzeGitHubTokenConfig();
    
    // Test token resolution for example repos
    const testRepos = [
      'https://github.com/microsoft/typescript',
      'https://github.com/facebook/react',
      'https://github.com/torvalds/linux',
      'https://github.com/unknown-user/repo'
    ];
    
    const tokenTests = testRepos.map(repo => ({
      url: repo,
      username: repo.match(/github\.com\/([^\/]+)/i)?.[1] || 'unknown',
      wouldUse: getTokenForRepoExample(repo),
      hasToken: !!getGitHubTokenForRepo(repo),
      tokenEnvVar: (() => {
        const match = repo.match(/github\.com\/([^\/]+)/i);
        if (!match) return 'GITHUB_TOKEN (fallback)';
        const username = match[1].toUpperCase();
        return process.env[`GITHUB_TOKEN_${username}`] 
          ? `GITHUB_TOKEN_${username}` 
          : 'GITHUB_TOKEN (fallback)';
      })()
    }));
    
    return NextResponse.json({
      config,
      tokenTests,
      environmentVars: {
        hasDefaultToken: !!process.env.GITHUB_TOKEN,
        userTokenVars: Object.keys(process.env)
          .filter(key => key.startsWith('GITHUB_TOKEN_') && key !== 'GITHUB_TOKEN')
          .sort()
      },
      help: {
        howToConfigure: [
          'Set GITHUB_TOKEN for default/fallback access',
          'Set GITHUB_TOKEN_USERNAME for account-specific tokens',
          'Example: GITHUB_TOKEN_MICROSOFT="ghp_token_here"',
          'Example: GITHUB_TOKEN_FACEBOOK="ghp_token_here"'
        ],
        tokenGeneration: 'https://github.com/settings/tokens',
        requiredScopes: ['repo (for private repos)', 'public_repo (for public repos)']
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze token configuration' },
      { status: 500 }
    );
  }
}

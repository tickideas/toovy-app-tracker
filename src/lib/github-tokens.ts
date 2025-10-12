// Utility functions for GitHub token management and debugging

export interface GitHubTokenConfig {
  default: boolean;
  username: string | null;
  tokenType: 'default' | 'user-specific';
  envVar: string;
}

export function analyzeGitHubTokenConfig(): {
  totalTokens: number;
  defaultToken: boolean;
  userTokens: string[];
  configs: GitHubTokenConfig[];
  examples: string[];
} {
  const configs: GitHubTokenConfig[] = [];
  const userTokens: string[] = [];
  
  // Check default token
  if (process.env.GITHUB_TOKEN) {
    configs.push({
      default: true,
      username: null,
      tokenType: 'default',
      envVar: 'GITHUB_TOKEN'
    });
  }
  
  // Check user-specific tokens
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('GITHUB_TOKEN_') && key !== 'GITHUB_TOKEN') {
      const username = key.replace('GITHUB_TOKEN_', '').toLowerCase();
      userTokens.push(username);
      configs.push({
        default: false,
        username,
        tokenType: 'user-specific',
        envVar: key
      });
    }
  });
  
  const examples = [
    'GITHUB_TOKEN="ghp_default_token"',
    'GITHUB_TOKEN_MICROSOFT="ghp_ms_token"',
    'GITHUB_TOKEN_FACEBOOK="ghp_fb_token"',
    'GITHUB_TOKEN_YOURUSERNAME="ghp_your_token"'
  ];
  
  return {
    totalTokens: configs.length,
    defaultToken: !!process.env.GITHUB_TOKEN,
    userTokens,
    configs,
    examples
  };
}

export function getTokenForRepoExample(githubUrl: string): string {
  const match = githubUrl.match(/github\.com\/([^\/]+)/i);
  const username = match ? match[1].toUpperCase() : 'UNKNOWN';
  
  if (username === 'UNKNOWN') {
    return `Would use default token: GITHUB_TOKEN`;
  }
  
  return `Would use: GITHUB_TOKEN_${username} (fallback to GITHUB_TOKEN if not set)`;
}

export function generateTokenHelp(): string {
  const config = analyzeGitHubTokenConfig();
  
  let help = `# GitHub Token Configuration\n\n`;
  help += `**Current Setup:** ${config.totalTokens} token(s) configured\n\n`;
  
  if (config.defaultToken) {
    help += `✅ Default token: \`GITHUB_TOKEN\`\n`;
  } else {
    help += `❌ No default token configured\n`;
  }
  
  if (config.userTokens.length > 0) {
    help += `\n**Account-specific tokens:**\n`;
    config.userTokens.forEach(username => {
      help += `✅ ${username}: \`GITHUB_TOKEN_${username.toUpperCase()}\`\n`;
    });
  } else {
    help += `\n❌ No account-specific tokens configured\n`;
  }
  
  help += `\n**How to add more accounts:**\n`;
  help += config.examples.map(example => `- \`${example}\``).join('\n');
  
  help += `\n\n**Token Requirements:**\n`;
  help += `- Generate at: https://github.com/settings/tokens\n`;
  help += `- Scope: \`repo\` for private repositories\n`;
  help += `- Scope: \`public_repo\` for public repositories (optional)\n`;
  
  return help;
}

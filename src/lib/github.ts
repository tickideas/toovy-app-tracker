interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    html_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

export interface RepoInsights {
  repo: GitHubRepo | null;
  recentCommits: GitHubCommit[];
  openIssues: GitHubIssue[];
  lastCommitDate: string | null;
  commitCount: number;
}

function extractRepoFromUrl(githubUrl: string): { owner: string; repo: string } | null {
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/\?#]+)(?:\/)?$/,
    /^https?:\/\/www\.github\.com\/([^\/]+)\/([^\/\?#]+)(?:\/)?$/,
  ];

  for (const pattern of patterns) {
    const match = githubUrl.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\/$/, '') };
    }
  }

  return null;
}

export async function getRepoInsights(githubUrl: string): Promise<RepoInsights> {
  const repoInfo = extractRepoFromUrl(githubUrl);
  
  if (!repoInfo) {
    return {
      repo: null,
      recentCommits: [],
      openIssues: [],
      lastCommitDate: null,
      commitCount: 0,
    };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AppTracker',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const baseUrl = 'https://api.github.com';
    
    // Fetch basic repo info
    const repoResponse = await fetch(
      `${baseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}`,
      { headers }
    );

    if (!repoResponse.ok) {
      console.error('GitHub API error:', repoResponse.statusText);
      return {
        repo: null,
        recentCommits: [],
        openIssues: [],
        lastCommitDate: null,
        commitCount: 0,
      };
    }

    const repo: GitHubRepo = await repoResponse.json();

    // Fetch recent commits (last 10)
    const commitsResponse = await fetch(
      `${baseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=10`,
      { headers }
    );

    let recentCommits: GitHubCommit[] = [];
    if (commitsResponse.ok) {
      recentCommits = await commitsResponse.json();
    }

    // Fetch open issues
    const issuesResponse = await fetch(
      `${baseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}/issues?state=open&per_page=20`,
      { headers }
    );

    let openIssues: GitHubIssue[] = [];
    if (issuesResponse.ok) {
      openIssues = await issuesResponse.json();
    }

    const lastCommitDate = recentCommits.length > 0 
      ? recentCommits[0].commit.author.date 
      : null;

    return {
      repo,
      recentCommits,
      openIssues,
      lastCommitDate,
      commitCount: recentCommits.length,
    };

  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return {
      repo: null,
      recentCommits: [],
      openIssues: [],
      lastCommitDate: null,
      commitCount: 0,
    };
  }
}

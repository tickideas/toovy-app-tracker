# GitHub Multi-Account Token Management

This document explains how to configure and use multiple GitHub accounts for repository insights in AppTracker.

## Overview

AppTracker supports multiple GitHub accounts through environment variables, allowing you to:
- Access private repositories from different GitHub accounts
- Use specific tokens for specific organizations/users
- Maintain proper access controls and rate limits

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Default/fallback token
GITHUB_TOKEN="ghp_your_default_token"

# Account-specific tokens (optional)
GITHUB_TOKEN_MICROSOFT="ghp_your_microsoft_token"
GITHUB_TOKEN_FACEBOOK="ghp_your_facebook_token"
GITHUB_TOKEN_GOOGLE="ghp_your_google_token"
GITHUB_TOKEN_YOURUSERNAME="ghp_your_personal_token"
GITHUB_TOKEN_YOURWORK="ghp_your_work_token"
```

### Token Naming Convention

- **Default Token**: `GITHUB_TOKEN`
- **User-Specific Tokens**: `GITHUB_TOKEN_{USERNAME}` (username in ALL CAPS)

### How It Works

1. **Repository URL**: `https://github.com/microsoft/typescript`
2. **Extract Username**: `microsoft` → `MICROSOFT`
3. **Check Environment**: Look for `GITHUB_TOKEN_MICROSOFT`
4. **Fallback**: If not found, use `GITHUB_TOKEN`

## Token Generation

### Create Personal Access Tokens

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Configure the token:
   - **Note**: "AppTracker - {Your Name}"
   - **Expiration**: Choose appropriate expiration (recommend 90 days or no expiration for development)
   - **Scopes**:
     - `repo` (required for private repositories)
     - `public_repo` (optional, for public repositories only)
     - `read:org` (if accessing private organization repos)

### Repository Access

Ensure your token has access to the target repositories:

| Repository Type | Required Scope | Example Usage |
|-----------------|----------------|---------------|
| Public          | `public_repo`  | `https://github.com/microsoft/typescript` |
| Private         | `repo`          | `https://github.com/yourname/your-private-repo` |
| Organization    | `repo` + `read:org` | `https://github.com/facebook/react` |

## Examples

### Basic Setup

```bash
# Single account setup
GITHUB_TOKEN="ghp_abcdefghijklmnop123456"
```

### Multi-Account Setup

```bash
# Multiple accounts for different organizations
GITHUB_TOKEN="ghp_default_fallback_token"
GITHUB_TOKEN_MICROSOFT="ghp_ms_token_abcdef123456"
GITHUB_TOKEN_FACEBOOK="ghp_fb_token_ghijkl789012"
GITHUB_TOKEN_GOOGLE="ghp_google_token_mnopqr345678"
GITHUB_TOKEN_WORK="ghp_work_token_stuvwx901234"
```

### Usage Examples

| Repository URL | Environment Variable Used | Reason |
|----------------|--------------------------|---------|
| `https://github.com/microsoft/typescript` | `GITHUB_TOKEN_MICROSOFT` | Exact match |
| `https://github.com/facebook/react` | `GITHUB_TOKEN_FACEBOOK` | Exact match |
| `https://github.com/unknown-user/repo` | `GITHUB_TOKEN` | Fallback (no specific token) |
| `https://gitlab.com/user/repo` | `GITHUB_TOKEN` | Not GitHub, uses fallback |

## Testing

### Debug Endpoint

Test your configuration using the debug endpoint:

```bash
curl http://localhost:3000/api/debug/github-tokens
```

### Response Example

```json
{
  "config": {
    "totalTokens": 3,
    "defaultToken": true,
    "userTokens": ["microsoft", "facebook"],
    "configs": [
      {
        "default": true,
        "username": null,
        "tokenType": "default",
        "envVar": "GITHUB_TOKEN"
      },
      {
        "default": false,
        "username": "microsoft",
        "tokenType": "user-specific",
        "envVar": "GITHUB_TOKEN_MICROSOFT"
      }
    ]
  },
  "tokenTests": [
    {
      "url": "https://github.com/microsoft/typescript",
      "username": "microsoft",
      "wouldUse": "Would use: GITHUB_TOKEN_MICROSOFT",
      "hasToken": true,
      "tokenEnvVar": "GITHUB_TOKEN_MICROSOFT"
    }
  ]
}
```

## Security Best Practices

### Token Security

1. **Never commit tokens to version control**
2. **Use environment-specific `.env` files**
3. **Rotate tokens regularly**
4. **Use minimal required scopes**
5. **Monitor token usage in GitHub Settings**

### Production Deployment

```bash
# Production environment variables (set in hosting platform)
GITHUB_TOKEN="${GITHUB_DEFAULT_TOKEN}"
GITHUB_TOKEN_MICROSOFT="${GITHUB_MS_TOKEN}"
GITHUB_TOKEN_FACEBOOK="${GITHUB_FB_TOKEN}"
```

### Development vs Production

| Environment | Token Source | Recommendation |
|-------------|---------------|----------------|
| Development | `.env.local` | Use personal tokens |
| Staging | Environment Variables | Use staging tokens |
| Production | Environment Variables | Use production tokens with limited access |

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Token doesn't have required scopes
2. **404 Not Found**: Token doesn't have access to repository
3. **401 Unauthorized**: Token is invalid or expired

### Debug Steps

1. **Check token configuration**:
   ```bash
   curl http://localhost:3000/api/debug/github-tokens
   ```

2. **Test token manually**:
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
        https://api.github.com/repos/OWNER/REPO
   ```

3. **Verify repository access**:
   - Check if repository is private
   - Verify token has `repo` scope
   - Confirm organization access if applicable

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Access denied: This is a private repository` | No token or insufficient access | Configure appropriate token |
| `GitHub API error (404)` | Repository not found or private | Check URL and token permissions |
| `GitHub API error (403)` | Rate limit exceeded or insufficient scope | Check token scopes and usage |

## Migration from Single Token

If you're upgrading from a single token setup:

1. **Keep existing token** as `GITHUB_TOKEN` (fallback)
2. **Add specific tokens** for frequently accessed accounts
3. **Test each repository** to ensure proper access
4. **Remove fallback** only when all repositories have specific tokens

### Migration Script

```bash
# Backup current token
CURRENT_TOKEN=$(grep GITHUB_TOKEN .env | cut -d'"' -f2)

# Add new specific tokens (example)
echo "GITHUB_TOKEN_MICROSOFT=\"$CURRENT_TOKEN\"" >> .env
echo "GITHUB_TOKEN_FACEBOOK=\"ghp_new_facebook_token\"" >> .env
```

## Rate Limits

GitHub API rate limits are per-token:

| Token Type | Rate Limit | Recommended Usage |
|------------|------------|-------------------|
| Authenticated | 5,000 requests/hour | Production |
| Unauthenticated | 60 requests/hour | Development only |

Using multiple tokens effectively multiplies your rate limit capacity.

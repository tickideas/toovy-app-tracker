# Public Sharing Configuration

This document explains how to configure public sharing links for AppTracker applications.

## Environment Variable

The most critical environment variable for sharing is:

```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # Your production domain
```

### Why This Matters

- **Development**: `http://localhost:3000` (works for local testing)
- **Production**: Must be your actual domain (e.g., `https://apptracker.tickideas.org`)
- **Problem**: If not configured, share links will point to localhost and won't work for external users

## Configuration Examples

### Local Development
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production (Vercel)
```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Production (Custom Domain)
```bash
NEXT_PUBLIC_APP_URL="https://apptracker.yourdomain.com"
```

### Production with Subdirectory
```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com/apptracker"
```

## Deployment Platform Specific Setup

### Vercel

1. **Automatic**: Vercel automatically sets `NEXT_PUBLIC_VERCEL_URL`
2. **Manual**: Still set `NEXT_PUBLIC_APP_URL` for consistency
3. **Environment Variables**:
   - Vercel Dashboard → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`

### Netlify

1. **Environment Variables**:
   - Site settings → Build & deploy → Environment
   - Add: `NEXT_PUBLIC_APP_URL=https://your-app.netlify.app`

### Railway

1. **Environment Variables**:
   - Your service → Variables
   - Add: `NEXT_PUBLIC_APP_URL=https://your-app.railway.app`

### Docker/Custom Server

```bash
# docker-compose.yml
environment:
  - NEXT_PUBLIC_APP_URL=https://yourdomain.com

# OR export command
export NEXT_PUBLIC_APP_URL=https://yourdomain.com
npm run build
```

## Testing Share Links

### Development Testing
1. Start local server: `npm run dev`
2. Create an app and generate share link
3. Verify URL: `http://localhost:3000/share/[code]`

### Production Testing
1. Deploy with correct `NEXT_PUBLIC_APP_URL`
2. Generate share link in production
3. Verify URL: `https://yourdomain.com/share/[code]`
4. Test with incognito browser window

## Troubleshooting

### Share Links Still Show Localhost

**Problem**: Share links use `http://localhost:3000` even in production

**Solutions**:
1. **Check Environment Variable**:
   ```bash
   echo $NEXT_PUBLIC_APP_URL  # Should show your domain
   ```

2. **Rebuild Application**:
   ```bash
   npm run build
   ```

3. **Clear Deployment Cache**:
   - Vercel: Redeploy from dashboard
   - Other: Clear CDN and rebuild

### Share Links Don't Work

**Checklist**:
- [ ] `NEXT_PUBLIC_APP_URL` is set correctly
- [ ] Application is rebuilt after changing env var
- [ ] DNS points to correct domain
- [ ] HTTPS certificate is valid
- [ ] No redirect loops

### Sharing Features Affected

The following features depend on `NEXT_PUBLIC_APP_URL`:

1. **Public Share Links**: Main sharing functionality
2. **Feedback URLs**: Links for stakeholder feedback
3. **Client Task Links**: Links to shared tasks
4. **Email Notifications**: URLs sent in emails
5. **API Documentation**: Links in API responses

## Security Considerations

### URL Security
- Share codes are cryptographically secure (8 characters, no ambiguity)
- No sensitive information in URLs
- URLs expire when configured (if implemented)

### Rate Limiting
- Consider implementing rate limiting on share endpoints
- Monitor for abuse of public sharing features
- Set reasonable expiration times for shares

### Access Control
- Public shares only expose what you choose to share
- Sensitive data (private repos, internal notes) remains protected
- Share permissions are granular (view, comment, create tasks)

## Migration Guide

### Moving from Localhost to Production

1. **Update Environment Variable**:
   ```bash
   # Old (development)
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   
   # New (production)
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

2. **Rebuild Application**:
   ```bash
   npm run build
   ```

3. **Deploy Changes**:
   - Push to your deployment platform
   - Wait for deployment to complete
   - Test share links work correctly

4. **Update Existing Shares**:
   - Existing share links with localhost will need regeneration
   - Users should create new share links for the correct domain

## Best Practices

### Always Set `NEXT_PUBLIC_APP_URL`

Even in development, set this to your eventual production domain to avoid surprises during deployment.

### Use Environment-Specific Values

```bash
# .env.local (development)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Production (deployment platform)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Test Before Deployment

1. Generate a test share link locally
2. Manually replace localhost with your domain
3. Verify the link structure is correct
4. Deploy and test the actual share functionality

### Monitor Share Usage

- Track how many share links are created
- Monitor access patterns on public shares
- Set up alerts for unusual sharing activity
- Regular cleanup of expired shares

## Code Examples

### Frontend Share Link Generation
```typescript
import { generateShareUrl } from '@/lib/share';

// Automatic usage with environment variable
const shareUrl = generateShareUrl('ABC123');
// Returns: https://yourdomain.com/share/ABC123

// Custom base URL
const customUrl = generateShareUrl('ABC123', 'https://custom.com');
// Returns: https://custom.com/share/ABC123
```

### Backend Share Link Generation
```typescript
// In API routes
const shareUrl = generateShareUrl(share.code, process.env.NEXT_PUBLIC_APP_URL);

// In database seeding
const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
```

### Testing Different Domains
```typescript
// Development
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Staging
process.env.NEXT_PUBLIC_APP_URL = 'https://staging.yourapp.com';

// Production
process.env.NEXT_PUBLIC_APP_URL = 'https://yourapp.com';
```

By properly configuring `NEXT_PUBLIC_APP_URL`, you ensure that all sharing features work correctly across all environments!

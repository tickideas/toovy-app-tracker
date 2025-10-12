import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';

  // Rate limiting temporarily disabled for testing
  // TODO: Re-enable after confirming authentication works
  /*
  const rateLimitResult = rateLimit({
    identifier: `login:${ip}`,
    maxRequests: 5, // 5 attempts per 15 minutes
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Too many login attempts. Please try again later.',
        resetTime: rateLimitResult.resetTime 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)),
        }
      }
    );
  }
  */
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    // Check credentials against environment variables
    const storedUsername = process.env.LOGIN_USERNAME;
    const storedPassword = process.env.LOGIN_PASSWORD;

    // Debug logging (remove in production)
    console.log('Login attempt:', { 
      providedUsername: username,
      storedUsername,
      passwordsMatch: password === storedPassword
    });

    if (!storedUsername || !storedPassword) {
      return NextResponse.json(
        { success: false, error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    if (username !== storedUsername) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials - username mismatch' },
        { status: 401 }
      );
    }

    // For now, use plain text comparison
    const isValidPassword = password === storedPassword;

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials - password mismatch' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: 'admin',
      username: username,
    });

    // Set secure session cookie
    await setAuthCookie(token);

    return NextResponse.json({ 
      success: true,
      user: { username }
    });

  } catch (error) {
    logger.apiError('/api/auth/login', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

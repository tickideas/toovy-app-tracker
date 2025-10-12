import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

async function getOrCreateUser() {
  // For simplicity, we'll use a hardcoded user ID or create one if it doesn't exist
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'admin@local.dev',
        name: 'Admin User'
      }
    });
  }

  return user;
}

export async function POST(request: NextRequest) {
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

    // Get or create the database user
    const user = await getOrCreateUser();

    // Generate JWT token with actual database user ID
    const token = generateToken({
      userId: user.id,
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

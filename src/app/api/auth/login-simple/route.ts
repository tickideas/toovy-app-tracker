import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setAuthCookie } from '@/lib/auth';

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
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // For now, use plain text comparison (can be enhanced with password hashing later)
    const isValidPassword = password === storedPassword;

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
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
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

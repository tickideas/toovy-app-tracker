import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  if (!authToken?.value) {
    return NextResponse.json({ authenticated: false });
  }

  const user = verifyToken(authToken.value);
  
  return NextResponse.json({
    authenticated: !!user,
    user: user ? { username: user.username } : null
  });
}

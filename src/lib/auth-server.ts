import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  
  if (!authToken?.value) return false;
  
  try {
    const user = verifyToken(authToken.value);
    return !!user;
  } catch (error) {
    return false;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  
  if (!authToken?.value) return null;
  
  return verifyToken(authToken.value);
}

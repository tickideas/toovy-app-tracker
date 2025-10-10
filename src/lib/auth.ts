import { cookies } from 'next/headers';

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  return authToken?.value === 'authenticated';
}
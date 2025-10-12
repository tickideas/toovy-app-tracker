import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      LOGIN_USERNAME: process.env.LOGIN_USERNAME ? 'set' : 'not set',
      LOGIN_PASSWORD: process.env.LOGIN_PASSWORD ? 'set' : 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set'
    }
  });
}

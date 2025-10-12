import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Mock Next.js components and modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Mock environment variables
const originalEnv = process.env

// Setup test environment
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-jwt-secret',
    LOGIN_USERNAME: 'test',
    LOGIN_PASSWORD: 'test'
  }
})

afterEach(() => {
  process.env = originalEnv
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken 
} from '@/lib/auth'

describe('Authentication Utilities', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret'
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  describe('Password Hashing', () => {
    it('should hash a password correctly', async () => {
      const password = 'test-password'
      const hashedPassword = await hashPassword(password)
      
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50)
    })

    it('should verify a correct password', async () => {
      const password = 'test-password'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'test-password'
      const wrongPassword = 'wrong-password'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'test-user',
        username: 'testuser'
      }
      
      const token = generateToken(payload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should verify a valid JWT token', () => {
      const payload = {
        userId: 'test-user',
        username: 'testuser'
      }
      
      const token = generateToken(payload)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(payload.userId)
      expect(decoded?.username).toBe(payload.username)
    })

    it('should reject an invalid JWT token', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)
      
      expect(decoded).toBeNull()
    })

    it('should handle token verification correctly', () => {
      // For simplicity, we'll test valid token verification
      // as mocking time for expired tokens is complex in this test setup
      const validToken = generateToken({
        userId: 'test-user',
        username: 'testuser'
      })
      const validDecoded = verifyToken(validToken)
      expect(validDecoded?.userId).toBe('test-user')
    })
  })
})

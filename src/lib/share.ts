import { randomBytes } from 'crypto';

/**
 * Generate a secure random share code
 * Format: 8 characters, alphanumeric, easy to read (no ambiguous characters)
 */
export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(8);
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  return code;
}

/**
 * Default permissions for share links
 */
export const DEFAULT_SHARE_PERMISSIONS = {
  view: true,
  comment: false,
  create_tasks: false,
};

/**
 * Permission presets for quick setup
 */
export const SHARE_PRESETS = {
  view_only: {
    view: true,
    comment: false,
    create_tasks: false,
  },
  can_comment: {
    view: true,
    comment: true,
    create_tasks: false,
  },
  full_access: {
    view: true,
    comment: true,
    create_tasks: true,
  },
} as const;

export type SharePermissions = typeof DEFAULT_SHARE_PERMISSIONS;
export type SharePreset = keyof typeof SHARE_PRESETS;

/**
 * Validate that share code format is correct
 */
export function isValidShareCode(code: string): boolean {
  const pattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]{8}$/;
  return pattern.test(code);
}

/**
 * Generate share URL from code
 */
export function generateShareUrl(code: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'): string {
  return `${baseUrl}/share/${code}`;
}

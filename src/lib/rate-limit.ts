interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

export function rateLimit({
  windowMs = 15 * 60 * 1000, // 15 minutes
  maxRequests = 5, // 5 requests per window
  identifier = '',
}: {
  windowMs?: number;
  maxRequests?: number;
  identifier: string;
}): { success: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const record = store.get(key);
  
  if (!record) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, resetTime: now + windowMs, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { 
      success: false, 
      resetTime: record.resetTime, 
      remaining: 0 
    };
  }
  
  record.count++;
  return { 
    success: true, 
    resetTime: record.resetTime, 
    remaining: maxRequests - record.count 
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

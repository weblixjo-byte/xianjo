// src/lib/security/rateLimiter.ts

// Global memory map to store IP request counts and expiration sliding windows
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

/**
 * Validates whether an IP address has exceeded its allocated request limit.
 * @param ip The unique identifier (IP Address)
 * @param limit Maximum allowed requests within the window
 * @param windowMs The time window in milliseconds
 * @returns boolean `true` if allowed, `false` if rate-limited (blocked)
 */
export function isAllowedRequest(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // If new IP or the previous window has expired
  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    
    // Garbage cleanup (Optional to prevent memory leaks over months of uptime)
    if (rateLimitMap.size > 10000) {
       for (const [key, val] of rateLimitMap.entries()) {
          if (val.resetTime < now) rateLimitMap.delete(key);
       }
    }
    
    return true;
  }

  // If the IP exceeded the limit within the active window
  if (record.count >= limit) {
    return false;
  }

  // Increment counter
  record.count += 1;
  return true;
}

/**
 * Extracts the raw IP address gracefully from standard NextJS Headers.
 */
export function extractIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp.trim();
  
  return "127.0.0.1"; // Default fallback
}

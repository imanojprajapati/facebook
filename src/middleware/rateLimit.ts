import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitConfig {
  tokensPerInterval: number;
  interval: number; // in milliseconds
  maxBurst?: number;
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly tokensPerInterval: number;
  private readonly interval: number;
  private readonly maxTokens: number;

  constructor({ tokensPerInterval, interval, maxBurst }: RateLimitConfig) {
    this.tokens = maxBurst || tokensPerInterval;
    this.lastRefill = Date.now();
    this.tokensPerInterval = tokensPerInterval;
    this.interval = interval;
    this.maxTokens = maxBurst || tokensPerInterval;
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const newTokens = (timePassed / this.interval) * this.tokensPerInterval;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
}

// Store rate limiters by IP
const rateLimiters = new Map<string, TokenBucket>();

// Rate limit configuration by endpoint
const rateLimitConfig: Record<string, RateLimitConfig> = {
  'default': {
    tokensPerInterval: 60,  // 60 requests
    interval: 60000,        // per minute
    maxBurst: 10           // allow burst of 10 requests
  },
  '/api/facebook/leads': {
    tokensPerInterval: 30,  // 30 requests
    interval: 60000,        // per minute
    maxBurst: 5            // allow burst of 5 requests
  },
  '/api/facebook/pages': {
    tokensPerInterval: 20,  // 20 requests
    interval: 60000,        // per minute
    maxBurst: 3            // allow burst of 3 requests
  }
};

export function getRateLimiter(ip: string, path: string): TokenBucket {
  const key = `${ip}:${path}`;
  if (!rateLimiters.has(key)) {
    const config = rateLimitConfig[path] || rateLimitConfig.default;
    rateLimiters.set(key, new TokenBucket(config));
  }
  return rateLimiters.get(key)!;
}

// Clean up old rate limiters periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, limiter] of rateLimiters.entries()) {
    if (now - limiter['lastRefill'] > 3600000) { // 1 hour
      rateLimiters.delete(key);
    }
  }
}, 3600000); // Clean up every hour

export function rateLimiter(req: NextRequest) {
  const ip = req.ip || 'anonymous';
  const path = req.nextUrl.pathname;
  const limiter = getRateLimiter(ip, path);

  if (!limiter.tryConsume()) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

  return NextResponse.next();
}
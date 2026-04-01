import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared Redis client — one connection, reused across all limiters
const redis = Redis.fromEnv();

// Public chat endpoint — 50 req/min per chatbotId
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 m"),
  analytics: false,
  prefix: "cb:chat",
});

// Training — 5 req/10 min per userId (OpenAI API + bulk DB writes)
export const trainRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: false,
  prefix: "cb:train",
});

// File upload — 20 req/10 min per userId (Vercel Blob writes)
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 m"),
  analytics: false,
  prefix: "cb:upload",
});

// Web scraping — 10 req/5 min per userId (outbound HTTP fetches)
export const scrapeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "5 m"),
  analytics: false,
  prefix: "cb:scrape",
});

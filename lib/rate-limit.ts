import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 50 requests per minute per chatbotId
export const chatRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "1 m"),
  analytics: false,
  prefix: "cb:chat",
});

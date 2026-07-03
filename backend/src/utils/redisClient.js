const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

const CACHE_TTL = {
  SHORT: 30,      // 30s — live/volatile data
  MEDIUM: 300,    // 5m — analytics summaries
  LONG: 3600,     // 1h — mostly-static data
};

async function getCache(key) {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function setCache(key, value, ttlSeconds = CACHE_TTL.MEDIUM) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // fail silently — cache is a best-effort layer
  }
}

async function invalidatePattern(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {
    // ignore
  }
}

module.exports = { redis, getCache, setCache, invalidatePattern, CACHE_TTL };

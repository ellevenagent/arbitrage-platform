/**
 * Upstash Redis - Optional Integration
 * 
 * Para adicionar Redis posteriormente:
 * 1. npm install @upstash/redis
 * 2. Configure variáveis de ambiente:
 *    - UPSTASH_REDIS_URL
 *    - UPSTASH_REDIS_TOKEN
 * 3. Descomente o código abaixo
 */

 // import { Redis } from '@upstash/redis';
 // 
 // export const redis = new Redis({
 //   url: process.env.UPSTASH_REDIS_URL || '',
 //   token: process.env.UPSTASH_REDIS_TOKEN || ''
 // });

// Exemplos de uso:
// await redis.set("key", "value");
// const value = await redis.get("key");

export {};

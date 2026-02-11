/**
 * Redis Publisher Service
 * Real-time data streaming via Redis Pub/Sub
 */

import Redis from 'ioredis';

export class RedisPublisher {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private channel = 'arbitrage:prices';

  constructor() {
    this.connect();
  }

  private connect(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.publisher = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3
      });

      this.subscriber = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3
      });

      this.publisher.on('error', (err) => {
        console.warn('⚠️ Redis publisher error (continuing without Redis):', err.message);
      });

      this.subscriber.on('error', (err) => {
        console.warn('Redis subscriber error:', err.message);
     });

      // Don't connect if Redis is not available
      console.log('📦 Redis configured (connection on first use)');
      
    } catch (error) {
      console.warn('⚠️ Redis not available, continuing without Redis');
    }
  }

  async publishPrice(priceData: any): Promise<void> {
    if (!this.publisher) return;
    
    try {
      await this.publisher.publish(this.channel, JSON.stringify({
        type: 'price',
        data: priceData,
        timestamp: Date.now()
      }));
    } catch (error) {
      // Silent fail - Redis is optional
    }
  }

  async publishArbitrage(opportunity: any): Promise<void> {
    if (!this.publisher) return;
    
    try {
      await this.publisher.publish(this.channel, JSON.stringify({
        type: 'arbitrage',
        data: opportunity,
        timestamp: Date.now()
      }));
    } catch (error) {
      // Silent fail
    }
  }

  isConnected(): boolean {
    return this.publisher?.status === 'ready';
  }

  disconnect(): void {
    if (this.publisher) {
      this.publisher.quit();
      this.publisher = null;
    }
    if (this.subscriber) {
      this.subscriber.quit();
      this.subscriber = null;
    }
  }
}

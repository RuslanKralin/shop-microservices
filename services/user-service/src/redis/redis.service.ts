import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async set(key: string, value: any, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    }
    return this.redis.set(key, JSON.stringify(value));
  }

  async get(key: string): Promise<any> {
    const value = await this.redis.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }
}

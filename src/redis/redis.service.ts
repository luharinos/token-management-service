import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * RedisService provides a simple interface for interacting with the Redis database.
 */
@Injectable()
export class RedisService {
    private readonly redis: Redis;
    private readonly REDIS_PORT: number;
    private readonly REDIS_HOST: string;

    /**
     * Constructs a new RedisService instance and initializes Redis connection settings.
     * It retrieves the Redis connection details (port and host) from the configuration service.
     * @param configService The service used to fetch configuration settings for Redis.
     */
    constructor(private readonly configService: ConfigService) {
        this.REDIS_PORT = +this.configService.get('REDIS_PORT', 6379);
        this.REDIS_HOST = this.configService.get('REDIS_HOST', 'localhost');
        this.redis = new Redis(this.REDIS_PORT, this.REDIS_HOST);
    }

    /**
     * Adds a member to a sorted set with an associated score at a specified key.
     * @param key The key associated with the sorted set.
     * @param score The score to assign to the member.
     * @param member The member to add to the sorted set.
     * @returns The number of members added to the set (excluding existing members with updated scores).
     */
    async zadd(key: string, score: number, member: string): Promise<number> {
        return this.redis.zadd(key, score, member);
    }

    /**
     * Adds multiple members with scores to a sorted set at a specified key.
     * @param key The key associated with the sorted set.
     * @param args An array containing scores and members to add.
     * @returns The number of new elements added to the sorted set.
     */
    async zaddBulk(
        key: string,
        ...args: (string | number | Buffer<ArrayBufferLike>)[]
    ): Promise<number> {
        return this.redis.zadd(key, ...args);
    }

    /**
     * Retrieves the number of elements in a sorted set stored at a specified key.
     * @param key The key associated with the sorted set.
     * @returns The total count of elements in the sorted set.
     */
    async zcard(key: string): Promise<number> {
        return this.redis.zcard(key);
    }

    /**
     * Removes and returns the member with the lowest score from a sorted set at a specified key.
     * @param key The key associated with the sorted set.
     * @returns The member with the lowest score, or null if the set is empty.
     */
    async zpopmin(key: string): Promise<string | null> {
        const result = await this.redis.zpopmin(key, 1);
        if (!result || result.length === 0) {
            return null;
        }
        return result[0];
    }

    /**
     * Retrieves a range of members in a sorted set at a specified key by their index.
     * @param key The key associated with the sorted set.
     * @param start The starting index for the range.
     * @param stop The ending index for the range.
     * @returns An array of members within the specified index range.
     */
    zrange(key: string, start: number, stop: number): Promise<string[]> {
        return this.redis.zrange(key, start, stop);
    }

    /**
     * Retrieves a range of members in a sorted set at a specified key, filtered by score.
     * @param key The key associated with the sorted set.
     * @param min The minimum score (inclusive) to filter members.
     * @param max The maximum score (inclusive) to filter members.
     * @returns An array of members whose scores fall within the specified range.
     */
    async zrangebyscore(
        key: string,
        min: number | string,
        max: number | string
    ): Promise<string[]> {
        return this.redis.zrangebyscore(key, min, max);
    }

    /**
     * Removes specified members from a sorted set at a specified key.
     * @param key The key associated with the sorted set.
     * @param members The members to remove from the sorted set.
     * @returns The number of members removed from the sorted set.
     */
    async zrem(
        key: string,
        ...members: (string | number | Buffer<ArrayBufferLike>)[]
    ): Promise<number> {
        return this.redis.zrem(key, members);
    }

    /**
     * Removes members in a sorted set at a specified key, filtered by score range.
     * @param key The key associated with the sorted set.
     * @param min The minimum score (inclusive) to filter members for removal.
     * @param max The maximum score (inclusive) to filter members for removal.
     * @returns The number of members removed from the sorted set.
     */
    async zremrangebyscore(
        key: string,
        min: number | string,
        max: number | string
    ): Promise<number> {
        return this.redis.zremrangebyscore(key, min, max);
    }

    /**
     * Retrieves the score associated with a member in a sorted set at a specified key.
     * @param key The key associated with the sorted set.
     * @param member The member whose score is to be fetched.
     * @returns The score of the member, or null if the member does not exist.
     */
    async zscore(key: string, member: string): Promise<string | null> {
        return this.redis.zscore(key, member);
    }
}

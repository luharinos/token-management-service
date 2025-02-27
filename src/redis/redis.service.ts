/**
 * This is a wrapper service for Redis.
 * It provides a simple interface for interacting with Redis library.
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
    private readonly redis: Redis;
    private readonly pubSubClient: Redis;
    private readonly REDIS_PORT: number;
    private readonly REDIS_HOST: string;
    private readonly KEYSPACE_EVENT_CONFIG_KEY: string;
    private readonly KEYSPACE_EVENT_CONFIG_VALUE_EXPIRY: string;
    private readonly KEYSPACE_EXPIRY_CHANNEL_NAME: string;

    /**
     * Initializes the RedisService with configuration settings.
     * Retrieves the Redis port and host from the configuration service
     * and creates a new Redis instance.
     * @param configService The configuration service to retrieve Redis settings.
     */
    constructor(private readonly configService: ConfigService) {
        this.REDIS_PORT = +this.configService.get('REDIS_PORT', 6379);
        this.REDIS_HOST = this.configService.get('REDIS_HOST', 'localhost');
        this.redis = new Redis(this.REDIS_PORT, this.REDIS_HOST);
        this.pubSubClient = this.redis.duplicate();
        this.KEYSPACE_EVENT_CONFIG_KEY = 'notify-keyspace-events';
        this.KEYSPACE_EVENT_CONFIG_VALUE_EXPIRY = 'Ex';
        this.KEYSPACE_EXPIRY_CHANNEL_NAME = '__keyevent@0__:expired';
    }

    /**
     * Called when the module has been initialized.
     * Connects to the Redis instance.
     */
    async onModuleInit() {
        // await this.redis.connect();
    }

    /**
     * Returns the number of elements in the set stored at the given key.
     * @param key The key of the set.
     */
    async scard(key: string): Promise<number> {
        return this.redis.scard(key);
    }

    /**
     * Sets a key-value pair in Redis with an expiration time.
     * The key will be automatically deleted after the specified number of seconds.
     * @param key The key to set in Redis.
     * @param value The value to associate with the key.
     * @param seconds The expiration time in seconds.
     * @returns A promise that resolves when the operation is complete.
     */
    async setWithExpiry(
        key: string,
        value: string,
        seconds: number
    ): Promise<void> {
        await this.redis.set(key, value, 'EX', seconds);
    }

    /**
     * Gets the value of the given token.
     * @param key The token to get.
     * @returns The value of the given token, or null if the token does not exist.
     */
    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    /**
     * Adds a member to a set stored at the given key.
     * @param key The key of the set.
     * @param members The values to add to the set.
     * @returns The number of elements that were added to the set, not including all the elements already present in the set.
     */
    async sadd(
        key: string,
        ...members: (string | number | Buffer<ArrayBufferLike>)[]
    ): Promise<number> {
        return this.redis.sadd(key, members);
    }

    /**
     * Removes and returns a random member from the set stored at the given key.
     * @param key The key of the set.
     * @returns The removed member, or null if the set is empty.
     */
    async spop(key: string): Promise<string | null> {
        return this.redis.spop(key);
    }

    /**
     * Adds a member with a score to a sorted set stored at the given key.
     * @param key The key of the sorted set.
     * @param score The score associated with the member.
     * @param member The member to add to the sorted set.
     * @returns The number of elements added to the sorted set (not including elements already existing for which the score was updated).
     */
    async zadd(key: string, score: number, member: string): Promise<number> {
        return this.redis.zadd(key, score, member);
    }

    /**
     * Sets a timeout on the key, after which the key will be deleted.
     * @param key The key to set the expiration time on.
     * @param seconds The expiration time in seconds.
     * @returns 1 if the timeout was set, 0 if the key does not exist.
     */
    async expire(key: string, seconds: number): Promise<number> {
        return this.redis.expire(key, seconds);
    }

    /**
     * Returns the score of a member in a sorted set stored at the given key.
     * @param key The key of the sorted set.
     * @param member The member whose score is to be retrieved.
     * @returns The score of the member, or null if the member does not exist.
     */
    async zscore(key: string, member: string): Promise<string | null> {
        return this.redis.zscore(key, member);
    }

    /**
     * Returns a range of members in a sorted set stored at the given key, by score.
     * @param key The key of the sorted set.
     * @param min The minimum score (inclusive).
     * @param max The maximum score (inclusive).
     * @returns An array of members in the specified score range.
     */
    async zrangebyscore(
        key: string,
        min: number | string,
        max: number | string
    ): Promise<string[]> {
        return this.redis.zrangebyscore(key, min, max);
    }

    /**
     * Removes a member from a sorted set stored at the given key.
     * @param key The key of the sorted set.
     * @param member The members to remove from the sorted set.
     * @returns The number of members removed from the sorted set, not including non-existing members.
     */
    async zrem(
        key: string,
        ...members: (string | number | Buffer<ArrayBufferLike>)[]
    ): Promise<number> {
        return this.redis.zrem(key, members);
    }

    /**
     * Removes the specified keys. A key is ignored if it does not exist.
     * @param key The keys to remove.
     * @returns The number of keys that were removed.
     */
    async del(...key: string[]): Promise<number> {
        return this.redis.del(key);
    }

    /**
     * Removes one or more members from a set stored at the given key.
     * @param key The key of the set.
     * @param members The members to remove from the set.
     * @returns The number of members that were removed from the set, not including non-existing members.
     */
    async srem(
        key: string,
        ...members: (string | number | Buffer<ArrayBufferLike>)[]
    ): Promise<number> {
        return this.redis.srem(key, members);
    }

    /**
     * Configures Redis to send a notification when a key expires.
     * The notification is sent to the key expired event.
     * @returns A promise that resolves when the configuration is complete.
     */
    async configureExpiryNotification(
        channel: string,
        _prefix: string | null = null
    ): Promise<void> {
        await this.redis.config(
            'SET',
            this.KEYSPACE_EVENT_CONFIG_KEY,
            this.KEYSPACE_EVENT_CONFIG_VALUE_EXPIRY
        );
        await this.subscribe(this.KEYSPACE_EXPIRY_CHANNEL_NAME);

        this.pubSubClient.on('message', (subChannel, key) => {
            if (subChannel === this.KEYSPACE_EXPIRY_CHANNEL_NAME) {
                if (_prefix === null || key.startsWith(_prefix)) {
                    this.redis.publish(channel, key);
                }
            }
        });
    }

    /**
     * Subscribes to the given channel.
     * @param channel The channel to subscribe to.
     * @returns A promise that resolves when the subscription is complete.
     */
    async subscribe(channel: string): Promise<void> {
        await this.pubSubClient.subscribe(channel);
    }

    /**
     * Registers a callback for the given event.
     * @param event The event to register the callback for.
     * @param callback The callback to register.
     * @returns A promise that resolves when the callback has been registered.
     */
    on(event: string, callback: (channel: string, key: string) => void): void {
        this.pubSubClient.on(event, callback);
    }
}

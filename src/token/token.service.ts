import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { AppLogger } from 'src/logger/logger.service';

/**
 * Service responsible for managing tokens.
 */
@Injectable()
export class TokenService implements OnModuleInit {
    /**
     * The key in Redis where all active tokens are stored.
     */
    private readonly ACTIVE_TOKENS = 'active_tokens';

    /**
     * The key in Redis where all available tokens are stored.
     */
    private readonly TOKEN_POOL = 'token_pool';

    /**
     * The interval for cleaning up expired tokens.
     */
    private readonly TOKEN_CLEANUP_INTERVAL: number;

    /**
     * The lifetime of a token in seconds.
     */
    private readonly TOKEN_LIFETIME: number;

    /**
     * The limit in seconds after which a token is considered inactive.
     */
    private readonly KEEP_ALIVE_LIMIT: number;

    /**
     * The maximum number of tokens that can be generated.
     */
    private readonly MAX_TOKENS: number;

    constructor(
        @Inject() private readonly redis: RedisService,
        private readonly configService: ConfigService,
        private readonly logger: AppLogger
    ) {
        this.logger.setContext(TokenService.name);

        // Initialize configuration values from the config service (in milli-seconds)
        this.MAX_TOKENS = +this.configService.get('MAX_TOKENS', 10000); // 10,000 tokens
        this.TOKEN_LIFETIME = +this.configService.get(
            'TOKEN_LIFETIME',
            60 * 1 * 1000
        ); // 1 minute
        this.KEEP_ALIVE_LIMIT = +this.configService.get(
            'KEEP_ALIVE_LIMIT',
            60 * 5 * 1000
        ); // 5 minutes
        this.TOKEN_CLEANUP_INTERVAL = +this.configService.get(
            'TOKEN_CLEANUP_INTERVAL',
            1 * 1000
        ); // 1 second
    }

    /**
     * Initializes the service by setting up the token cleanup interval.
     */
    onModuleInit() {
        this.logger.debug('Initializing token service');
        setInterval(this.cleanupTokens.bind(this), this.TOKEN_CLEANUP_INTERVAL);
    }

    /**
     * Generates a specified number of tokens.
     * @param count The number of tokens to generate.
     * @returns An array of generated tokens.
     */
    async generateTokens(count: number): Promise<string[]> {
        this.logger.debug(`Generating ${count} new tokens`);

        const currentCount = await this.redis.zcard(this.TOKEN_POOL);

        // Check whether the new tokens exceed the maximum allowed
        if (currentCount + count > this.MAX_TOKENS) {
            this.logger.warn(
                `Cannot generate more than ${this.MAX_TOKENS} tokens.`
            );
            throw new Error(
                `Cannot generate more than ${this.MAX_TOKENS} tokens.`
            );
        }

        // Generate new UUID tokens
        const tokens = Array.from({ length: count }, () => uuidv4());
        const score = Date.now() + this.KEEP_ALIVE_LIMIT * 1000;

        // Prepare arguments for zaddBulk
        const zaddArgs = tokens.flatMap((token) => [score, token]);

        // Add tokens to the token pool with expiration scores
        await this.redis.zaddBulk(this.TOKEN_POOL, ...zaddArgs);
        this.logger.log(`Generated ${count} new tokens`);
        return tokens;
    }

    /**
     * Assigns a token to a user.
     * @returns The assigned token, or null if no token is available.
     */
    async assignToken(): Promise<string | null> {
        this.logger.debug('Assigning a new token');

        // Pop a token from the pool
        const token = await this.redis.zpopmin(this.TOKEN_POOL);
        if (!token) {
            this.logger.warn('No tokens are available in the pool');
            return null;
        }

        // Add the token to active tokens with a new expiration time
        await this.redis.zadd(
            this.ACTIVE_TOKENS,
            Date.now() + this.TOKEN_LIFETIME * 1000,
            token
        );
        this.logger.log(`Assigned token ${token}`);
        return token;
    }

    /**
     * Keeps a token alive by extending its lifetime.
     * @param token The token to keep alive.
     * @returns True if the token was kept alive, false otherwise.
     */
    async keepAlive(token: string): Promise<boolean> {
        this.logger.debug(`Keeping token ${token} alive`);

        // Check if token is active
        let score = await this.redis.zscore(this.ACTIVE_TOKENS, token);

        if (score) {
            // Extend token's lifetime
            await this.redis.zadd(
                this.ACTIVE_TOKENS,
                Date.now() + this.TOKEN_LIFETIME * 1000,
                token
            );
            this.logger.log(`Kept token ${token} alive`);
            return true;
        } else {
            // Check if token is in the pool
            score = await this.redis.zscore(this.TOKEN_POOL, token);
            if (!score) {
                this.logger.warn(`Token ${token} is not available`);
                return false;
            }

            // Extend token's lifetime in the pool
            await this.redis.zadd(
                this.TOKEN_POOL,
                Date.now() + this.KEEP_ALIVE_LIMIT * 1000,
                token
            );
            this.logger.log(`Kept token ${token} alive in the pool`);
        }

        return true;
    }

    /**
     * Unblocks a token by adding it back to the pool.
     * @param token The token to unblock.
     * @returns True if the token was unblocked, false otherwise.
     */
    async unblockToken(token: string): Promise<boolean> {
        this.logger.debug(`Unblocking token ${token}`);

        // Remove the token from active tokens
        const removed = await this.redis.zrem(this.ACTIVE_TOKENS, token);
        if (removed === 0) {
            this.logger.warn(`Token ${token} is not active`);
            return false;
        }

        // Add the token back to the pool
        await this.redis.zadd(
            this.TOKEN_POOL,
            Date.now() + this.KEEP_ALIVE_LIMIT * 1000,
            token
        );
        this.logger.log(`Unblocked token ${token}`);
        return true;
    }

    /**
     * Deletes a token from both active tokens and the pool.
     * @param token The token to delete.
     * @returns True if the token was deleted, false otherwise.
     */
    async deleteToken(token: string): Promise<boolean> {
        this.logger.debug(`Deleting token ${token}`);

        await this.redis.zrem(this.ACTIVE_TOKENS, token);
        await this.redis.zrem(this.TOKEN_POOL, token);

        this.logger.log(`Deleted token ${token}`);
        return true;
    }

    /**
     * Cleans up expired tokens by removing them from active tokens
     * and adding them back to the pool.
     */
    private async cleanupTokens() {
        this.logger.debug('Cleaning up expired tokens');

        // Fetch expired active tokens
        const expiredActiveTokens = await this.redis.zrangebyscore(
            this.ACTIVE_TOKENS,
            0,
            Date.now()
        );

        if (expiredActiveTokens.length > 0) {
            // Remove expired active tokens
            await this.redis.zrem(this.ACTIVE_TOKENS, ...expiredActiveTokens);

            // Add expired tokens back to the pool with new expiration scores
            const poolInsertArgs = expiredActiveTokens.flatMap((token) => [
                Date.now() + this.KEEP_ALIVE_LIMIT * 1000,
                token
            ]);
            await this.redis.zaddBulk(this.TOKEN_POOL, ...poolInsertArgs);
        }

        // Remove expired tokens from the pool
        await this.redis.zremrangebyscore(this.TOKEN_POOL, 0, Date.now());
        this.logger.debug('Cleaned up expired tokens');
    }
}

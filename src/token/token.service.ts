import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service responsible for managing tokens.
 */
@Injectable()
export class TokenService implements OnModuleInit {
    /**
     * The key in Redis where all available tokens are stored.
     */
    private readonly TOKEN_POOL = 'token_pool';

    /**
     * The key in Redis where all active tokens are stored.
     */
    private readonly ACTIVE_TOKENS = 'active_tokens';

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
        private readonly configService: ConfigService
    ) {
        this.TOKEN_LIFETIME = +this.configService.get('TOKEN_LIFETIME', 60); // 1 minute
        this.KEEP_ALIVE_LIMIT = +this.configService.get(
            'KEEP_ALIVE_LIMIT',
            60 * 5
        ); // 5 minutes
        this.MAX_TOKENS = +this.configService.get('MAX_TOKENS', 10000); // 10000 tokens
    }

    /**
     * Initializes the service.
     */
    onModuleInit() {
        console.log('TokenService has been initialized.');
    }

    /**
     * Generates a specified number of tokens.
     * @param count The number of tokens to generate.
     * @returns An array of generated tokens.
     */
    async generateTokens(count: number): Promise<string[]> {
        const currentCount = await this.redis.scard(this.TOKEN_POOL);
        if (currentCount + count > this.MAX_TOKENS) {
            throw new Error(
                `Cannot generate more than ${this.MAX_TOKENS} tokens.`
            );
        }

        const tokens = Array.from({ length: count }, () => uuidv4());
        await this.redis.sadd(this.TOKEN_POOL, ...tokens);
        return tokens;
    }

    /**
     * Assigns a token to a user.
     * @returns The assigned token, or null if no token is available.
     */
    async assignToken(): Promise<string | null> {
        const token = await this.redis.spop(this.TOKEN_POOL);
        if (!token) return null;

        await this.redis.zadd(
            this.ACTIVE_TOKENS,
            Date.now() + this.TOKEN_LIFETIME * 1000,
            token
        );
        await this.redis.expire(`token:${token}`, this.TOKEN_LIFETIME);
        return token;
    }

    /**
     * Keeps a token alive by extending its lifetime.
     * @param token The token to keep alive.
     * @returns True if the token was kept alive, false otherwise.
     */
    async keepAlive(token: string): Promise<boolean> {
        const score = await this.redis.zscore(this.ACTIVE_TOKENS, token);
        if (!score) return false;

        await this.redis.zadd(
            this.ACTIVE_TOKENS,
            Date.now() + this.KEEP_ALIVE_LIMIT * 1000,
            token
        );
        await this.redis.expire(`token:${token}`, this.KEEP_ALIVE_LIMIT);
        return true;
    }

    /**
     * Unblocks a token by adding it back to the pool.
     * @param token The token to unblock.
     * @returns True if the token was unblocked, false otherwise.
     */
    async unblockToken(token: string): Promise<boolean> {
        const removed = await this.redis.zrem(this.ACTIVE_TOKENS, token);
        if (removed === 0) return false;

        await this.redis.sadd(this.TOKEN_POOL, token);
        return true;
    }

    /**
     * Deletes a token.
     * @param token The token to delete.
     * @returns True if the token was deleted, false otherwise.
     */
    async deleteToken(token: string): Promise<boolean> {
        await this.redis.zrem(this.ACTIVE_TOKENS, token);
        await this.redis.srem(this.TOKEN_POOL, token);
        await this.redis.del(`token:${token}`);
        return true;
    }

    /**
     * Cleans up expired tokens.
     */
    private async cleanupTokens() {
        const expiredTokens = await this.redis.zrangebyscore(
            this.ACTIVE_TOKENS,
            0,
            Date.now()
        );
        if (expiredTokens.length === 0) return;

        await this.redis.zrem(this.ACTIVE_TOKENS, ...expiredTokens);
        await this.redis.del(...expiredTokens.map((token) => `token:${token}`));
    }
}

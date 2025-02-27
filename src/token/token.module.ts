import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
    providers: [TokenService, RedisService],
    controllers: [TokenController]
})
export class TokenModule {}

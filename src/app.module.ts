import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TokenModule } from './token/token.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './logger/logger.middleware';
import { WinstonModule } from 'nest-winston';
import { LoggerModule } from './logger/logger.module';

@Module({
    imports: [
        WinstonModule.forRoot({}), // Load WinstonModule
        ConfigModule.forRoot({ isGlobal: true }), // Load .env variables globally
        TokenModule,
        LoggerModule
    ],
    controllers: [],
    providers: [],
    exports: []
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}

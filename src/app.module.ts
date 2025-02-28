import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './logger/logger.middleware';
import { AppLogger } from './logger/logger.service';
import { WinstonModule } from 'nest-winston';

@Module({
    imports: [
        WinstonModule.forRoot({}), // Load WinstonModule
        ConfigModule.forRoot({ isGlobal: true }), // Load .env variables globally
        TokenModule
    ],
    controllers: [AppController],
    providers: [AppService, AppLogger],
    exports: [AppLogger]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}

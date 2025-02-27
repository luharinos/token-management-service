import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }), // Load .env variables globally
        TokenModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}

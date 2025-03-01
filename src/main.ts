import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './logger/logger.service';
import { GlobalExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { logger: false });
    const logger = app.get(AppLogger);
    // logger.setContext('Bootstrap');

    app.useGlobalFilters(new GlobalExceptionFilter(logger));

    const PORT = process.env.PORT || 3000;
    await app.listen(PORT);

    logger.log(`🚀 Application is running on: ${PORT}`);
    logger.debug(`📅 Started at: ${new Date().toLocaleString()}`);
}
bootstrap();

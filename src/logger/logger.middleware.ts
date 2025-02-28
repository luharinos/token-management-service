import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(private readonly appLogger: AppLogger) {}
    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        const startTime = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const elapsedTime = Date.now() - startTime;
            const message = `${method} ${originalUrl} ${statusCode} ${elapsedTime}ms`;

            if (res.statusCode >= 500) {
                this.appLogger.error(message);
            } else if (res.statusCode >= 400) {
                this.appLogger.warn(message);
            } else {
                this.appLogger.log(message);
            }
        });

        next();
    }
}

import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
    private readonly logger: winston.Logger;

    constructor(private readonly configService: ConfigService) {
        this.logger = winston.createLogger({
            level: this.configService.get('LOG_LEVEL', 'INFO').toLowerCase(),
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message }) => {
                    const colorizer = winston.format.colorize().colorize;
                    return `[${timestamp}] ${colorizer(level, level.toUpperCase())}: ${message}`;
                })
            ),
            transports: [new winston.transports.Console()]
        });
    }

    log(message: string, context = 'App') {
        this.logger.info(`[${context}] ${message}`);
    }

    error(message: string, trace?: string, context = 'App') {
        this.logger.error(
            `[${context}] ${message} ${trace ? '| ' + trace : ''}`
        );
    }

    warn(message: string, context = 'App') {
        this.logger.warn(`[${context}] ${message}`);
    }

    debug(message: string, context = 'App') {
        this.logger.debug(`[${context}] ${message}`);
    }
}

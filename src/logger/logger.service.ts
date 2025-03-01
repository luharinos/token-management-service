import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
    private context: string;
    private readonly logger: winston.Logger;

    constructor(private readonly configService: ConfigService) {
        this.context = 'App';
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

    setContext(context: string) {
        this.context = context;
    }

    log(message: string) {
        this.logger.info(`[${this.context}] ${message}`);
    }

    error(message: string, trace?: string) {
        this.logger.error(
            `[${this.context}] ${message} ${trace ? '| ' + trace : ''}`
        );
    }

    warn(message: string) {
        this.logger.warn(`[${this.context}] ${message}`);
    }

    debug(message: string) {
        this.logger.debug(`[${this.context}] ${message}`);
    }
}

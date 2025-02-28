import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { AppLogger } from 'src/logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: AppLogger) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseMessage = exception.getResponse();
            message =
                typeof responseMessage === 'string'
                    ? responseMessage
                    : JSON.stringify(responseMessage);
        }

        this.logger.error(`HTTP ${status} - ${JSON.stringify(message)}`);

        response.status(status).json({
            statusCode: status,
            message
        });
    }
}

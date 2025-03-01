import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    HttpException,
    HttpStatus,
    Put
} from '@nestjs/common';
import { TokenService } from './token.service';
import { AppLogger } from 'src/logger/logger.service';

@Controller('token')
export class TokenController {
    constructor(
        private readonly logger: AppLogger,
        private readonly tokenService: TokenService
    ) {
        this.logger.setContext(TokenController.name);
    }

    @Post('generate')
    async generate(@Body('count') count: number) {
        this.logger.debug('Attempting to generate tokens');
        if (!count || count <= 0) {
            this.logger.warn('Invalid count provided');
            throw new HttpException('Invalid count', HttpStatus.BAD_REQUEST);
        }

        const tokens = await this.tokenService.generateTokens(count);
        this.logger.log(`Generated ${tokens.length} tokens`);
        return { tokens };
    }

    @Get('assign')
    async assign() {
        this.logger.debug('Attempting to assign a token');
        const token = await this.tokenService.assignToken();
        if (!token) {
            this.logger.warn('No available tokens');
            throw new HttpException(
                'No available tokens',
                HttpStatus.NOT_FOUND
            );
        }
        this.logger.log('Token assigned successfully');
        return { token };
    }

    @Post('unblock')
    async unblock(@Body('token') token: string) {
        this.logger.debug(`Attempting to unblock token: ${token}`);
        if (!token) {
            this.logger.warn('Invalid token provided');
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }
        const success = await this.tokenService.unblockToken(token);
        if (!success) {
            this.logger.warn('Token not found or already unblocked');
            throw new HttpException(
                'Token not found or already unblocked',
                HttpStatus.NOT_FOUND
            );
        }

        this.logger.log('Token unblocked successfully');
        return { message: 'Token unblocked' };
    }

    @Delete('delete')
    async delete(@Body('token') token: string) {
        this.logger.debug(`Attempting to delete token: ${token}`);
        if (!token) {
            this.logger.warn('Invalid token provided');
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }
        const success = await this.tokenService.deleteToken(token);
        if (!success) {
            this.logger.warn('Token not found or already deleted');
            throw new HttpException(
                'Token not found or already deleted',
                HttpStatus.NOT_FOUND
            );
        }

        this.logger.log('Token deleted successfully');
        return { message: 'Token deleted' };
    }

    @Put('keep-alive')
    async keepAlive(@Body('token') token: string) {
        this.logger.debug(
            `Attempting to extend keep-alive for token: ${token}`
        );
        if (!token) {
            this.logger.warn('Invalid token provided');
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }
        const success = await this.tokenService.keepAlive(token);
        if (!success) {
            this.logger.warn('Token not found or already expired');
            throw new HttpException(
                'Token not found or already expired',
                HttpStatus.NOT_FOUND
            );
        }

        this.logger.log('Token keep-alive extended successfully');
        return { message: 'Token keep-alive extended' };
    }
}

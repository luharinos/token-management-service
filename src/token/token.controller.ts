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

@Controller('token')
export class TokenController {
    constructor(private readonly tokenService: TokenService) {}

    @Post('generate')
    async generate(@Body('count') count: number) {
        if (!count || count <= 0) {
            throw new HttpException('Invalid count', HttpStatus.BAD_REQUEST);
        }

        const tokens = await this.tokenService.generateTokens(count);
        return { tokens };
    }

    @Get('assign')
    async assign() {
        const token = await this.tokenService.assignToken();
        if (!token) {
            throw new HttpException(
                'No available tokens',
                HttpStatus.NOT_FOUND
            );
        }
        return { token };
    }

    @Post('unblock')
    async unblock(@Body('token') token: string) {
        if (!token) {
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }
        const success = await this.tokenService.unblockToken(token);
        if (!success) {
            throw new HttpException(
                'Token not found or already unblocked',
                HttpStatus.NOT_FOUND
            );
        }

        return { message: 'Token unblocked' };
    }

    @Delete('delete')
    async delete(@Body('token') token: string) {
        if (!token) {
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }
        const success = await this.tokenService.deleteToken(token);
        if (!success) {
            throw new HttpException(
                'Token not found or already deleted',
                HttpStatus.NOT_FOUND
            );
        }

        return { message: 'Token deleted' };
    }

    @Put('keep-alive')
    async keepAlive(@Body('token') token: string) {
        if (!token) {
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }
        const success = await this.tokenService.keepAlive(token);
        if (!success) {
            throw new HttpException(
                'Token not found or already expired',
                HttpStatus.NOT_FOUND
            );
        }

        return { message: 'Token keep-alive extended' };
    }
}

import { HttpException } from '@nestjs/common';
export declare class OAuthException extends HttpException {
    readonly redirectUrl: string;
    constructor(redirectUrl: string);
}

import { HttpException, HttpStatus } from '@nestjs/common';

export class OAuthException extends HttpException {
  constructor(public readonly redirectUrl: string) {
    super('OAuth Login Failed', HttpStatus.FOUND);
  }
}

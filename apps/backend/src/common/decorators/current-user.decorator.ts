import { ExecutionContext, createParamDecorator } from '@nestjs/common';

type CurrentUserPayload = Record<string, unknown> | undefined;

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: CurrentUserPayload }>();

    return request.user;
  },
);

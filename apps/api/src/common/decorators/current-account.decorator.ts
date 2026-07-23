import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestAccount } from '../types/request-context';

/**
 * Injecte le compte actif (req.account), posé par AccountGuard.
 * Usage : `list(@CurrentAccount() account: RequestAccount)`.
 */
export const CurrentAccount = createParamDecorator(
  (data: keyof RequestAccount | undefined, ctx: ExecutionContext): RequestAccount | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const account: RequestAccount = request.account;
    return data ? account?.[data] : account;
  },
);

import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Identificação de Tenant não encontrada na sessão');
    }

    return user.tenantId;
  },
);

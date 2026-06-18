import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { GqlContextType } from '@nestjs/graphql';

const GRPC_TO_HTTP: Record<number, number> = {
  1: 499,  // CANCELLED
  3: 400,  // INVALID_ARGUMENT
  5: 404,  // NOT_FOUND
  6: 409,  // ALREADY_EXISTS
  7: 403,  // PERMISSION_DENIED
  11: 416, // OUT_OF_RANGE
  12: 501, // UNIMPLEMENTED
  14: 503, // UNAVAILABLE (svc-roadmap not running)
  16: 401, // UNAUTHENTICATED
};

@Catch()
export class GrpcExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      return super.catch(exception, host);
    }

    const grpc = exception as { code?: number; message?: string };
    const httpStatus: number = (grpc.code !== undefined ? GRPC_TO_HTTP[grpc.code] : undefined) ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = grpc.code === 14
      ? 'Backend service unavailable — make sure svc-roadmap is running'
      : (grpc.message ?? 'Internal server error');

    if (host.getType<GqlContextType>() === 'graphql') {
      throw new HttpException({ statusCode: httpStatus, message }, httpStatus);
    }

    const res = host.switchToHttp().getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    res.status(httpStatus).json({ statusCode: httpStatus, message });
  }
}

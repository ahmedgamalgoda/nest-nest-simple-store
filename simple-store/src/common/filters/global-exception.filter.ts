import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? ((exception.getResponse() as any)?.message ?? exception.message)
        : 'An error occurred';

    // Log the error to console and via Nest Logger
    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    console.error(`[GlobalExceptionFilter] Error caught on ${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''}:`, errorMessage);
    if (errorStack) {
      console.error(errorStack);
    }

    this.logger.error(
      `${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''} ${status} - ${errorMessage}`,
      errorStack,
    );

    // Send the structured error response
    response.status(status).json({
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

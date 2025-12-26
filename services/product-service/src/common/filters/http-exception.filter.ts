import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        message = (response as any).message || message;
        errors = (response as any).errors || errors;
      } else if (typeof response === 'string') {
        message = response;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error(`[${new Date().toISOString()}] Ошибка: ${message}`, {
      path: request.url,
      method: request.method,
      exception,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(errors.length > 0 ? { errors } : {}),
    });
  }
}

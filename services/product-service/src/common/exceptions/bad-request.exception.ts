import { HttpException, HttpStatus } from '@nestjs/common';

export class BadRequestException extends HttpException {
  constructor(
    message: string,
    public errors?: string[] | Record<string, any>[],
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        ...(errors && { errors }),
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

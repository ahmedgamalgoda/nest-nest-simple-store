import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method } = req;
    const requestUrl = req.originalUrl || req.url;

    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`${method} ${requestUrl} ${statusCode}`);
    });

    next();
  }
}

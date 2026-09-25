import { Logger } from '@nestjs/common';
import { LoggingMiddleware } from './logging.middleware.js';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next() and log request method, url, and status code on response finish', () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    let finishCallback: () => void = () => {};

    const req: any = {
      method: 'GET',
      originalUrl: '/products',
    };

    const res: any = {
      statusCode: 200,
      on: vi.fn().mockImplementation((event: string, cb: () => void) => {
        if (event === 'finish') {
          finishCallback = cb;
        }
      }),
    };

    const next = vi.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Trigger response finish event
    finishCallback();

    expect(logSpy).toHaveBeenCalledWith('GET /products 200');
  });

  it('should fall back to req.url if originalUrl is not defined', () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    let finishCallback: () => void = () => {};

    const req: any = {
      method: 'POST',
      url: '/orders',
    };

    const res: any = {
      statusCode: 201,
      on: vi.fn().mockImplementation((event: string, cb: () => void) => {
        if (event === 'finish') {
          finishCallback = cb;
        }
      }),
    };

    const next = vi.fn();

    middleware.use(req, res, next);
    finishCallback();

    expect(logSpy).toHaveBeenCalledWith('POST /orders 201');
  });
});

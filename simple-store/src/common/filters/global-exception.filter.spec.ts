import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter.js';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test-error',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch an unhandled Error, log to console, and return status 500 with "An error occurred"', () => {
    const error = new Error('Database disk full');

    filter.catch(error, mockHost);

    expect(console.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'An error occurred',
      timestamp: expect.any(String),
    });

    const callArgs = mockResponse.json.mock.calls[0][0];
    expect(new Date(callArgs.timestamp).toISOString()).toBe(callArgs.timestamp);
  });

  it('should catch an HttpException and return its status and message', () => {
    const httpError = new HttpException('Resource not found', HttpStatus.NOT_FOUND);

    filter.catch(httpError, mockHost);

    expect(console.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Resource not found',
      timestamp: expect.any(String),
    });
  });

  it('should catch an HttpException with an object response message', () => {
    const httpError = new HttpException(
      { message: 'Invalid payload format', error: 'Bad Request', statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(httpError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid payload format',
      timestamp: expect.any(String),
    });
  });

  it('should handle non-Error thrown objects and default to 500', () => {
    filter.catch('A strange string error', mockHost);

    expect(console.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'An error occurred',
      timestamp: expect.any(String),
    });
  });
});

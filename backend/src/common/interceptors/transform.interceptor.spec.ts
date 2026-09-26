import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor.js';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  const mockExecutionContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap successful responses in { success: true, data, timestamp }', async () => {
    const payload = { id: 'prod-1', name: 'Wireless Mouse', price: 29.99 };

    const mockCallHandler: CallHandler = {
      handle: () => of(payload),
    };

    const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);
    const result = await lastValueFrom(observable);

    expect(result).toEqual({
      success: true,
      data: payload,
      timestamp: expect.any(String),
    });

    // Check that timestamp is a valid ISO string
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('should wrap array responses correctly', async () => {
    const payload = [
      { id: 'prod-1', name: 'Item 1' },
      { id: 'prod-2', name: 'Item 2' },
    ];

    const mockCallHandler: CallHandler = {
      handle: () => of(payload),
    };

    const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);
    const result = await lastValueFrom(observable);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
    expect(result.timestamp).toBeDefined();
  });

  it('should wrap null or primitive responses correctly', async () => {
    const mockCallHandler: CallHandler = {
      handle: () => of(null),
    };

    const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);
    const result = await lastValueFrom(observable);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('should not modify errors and allow them to propagate to exception filters', async () => {
    const error = new Error('Database connection failed');

    const mockCallHandler: CallHandler = {
      handle: () => throwError(() => error),
    };

    const observable = interceptor.intercept(mockExecutionContext, mockCallHandler);

    await expect(lastValueFrom(observable)).rejects.toThrow('Database connection failed');
  });
});

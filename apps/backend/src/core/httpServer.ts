import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fastify, type FastifyInstance, type FastifyRequest } from 'fastify';
import type { FastifySchemaValidationError } from 'fastify/types/schema.js';

import { TokenService } from '../common/auth/tokenService.ts';
import { ExternalServiceError } from '../common/errors/externalServiceError.ts';
import { ForbiddenAccessError } from '../common/errors/forbiddenAccessError.ts';
import { InputNotValidError } from '../common/errors/inputNotValidError.ts';
import { OperationNotValidError } from '../common/errors/operationNotValidError.ts';
import { ResourceAlreadyExistsError } from '../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../common/errors/resourceNotFoundError.ts';
import { serializeError } from '../common/errors/serializeError.ts';
import { UnauthorizedAccessError } from '../common/errors/unathorizedAccessError.ts';
import { IdService } from '../common/id/idService.ts';
import { type LoggerService } from '../common/logger/loggerService.ts';
import { OpenRouterService } from '../common/openRouter/openRouterService.ts';
import type { DatabaseClient } from '../infrastructure/database/databaseClient.ts';
import { healthRoutes } from '../modules/health/routes/healthRoutes.ts';
import { recommendationRoutes } from '../modules/recommendation/routes/recommendationRoutes.ts';
import { seriesRoutes } from '../modules/series/routes/seriesRoutes.ts';
import { userRoutes } from '../modules/user/routes/userRoutes.ts';
import { watchroomRoutes } from '../modules/watchroom/routes/watchroomRoutes.ts';

import { type Config } from './config.ts';

const maxObjectDepth = 10;
const maxStringLength = 10000;
const maxBodySize = 512 * 1024; // 512KB

// TODO: add CSRF protection
export class HttpServer {
  public readonly fastifyServer: FastifyInstance;
  private readonly loggerService: LoggerService;
  private readonly config: Config;
  private readonly databaseClient: DatabaseClient;
  private isShuttingDown = false;
  private activeConnections = 0;

  public constructor(config: Config, loggerService: LoggerService, databaseClient: DatabaseClient) {
    this.config = config;
    this.loggerService = loggerService;
    this.databaseClient = databaseClient;

    this.fastifyServer = fastify({
      bodyLimit: maxBodySize,
      logger: false,
      connectionTimeout: 30000, // 30s
      keepAliveTimeout: 5000, // 5s
      requestTimeout: 30000, // 30s
      trustProxy: true,
    }).withTypeProvider<TypeBoxTypeProvider>();
  }

  public async start(): Promise<void> {
    const { host, port } = this.config.server;

    this.setupErrorHandler();

    await this.fastifyServer.register(fastifyCookie, { secret: this.config.cookie.secret });

    await this.fastifyServer.register(fastifyCors, {
      origin: this.config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-ID'],
    });

    await this.fastifyServer.register(fastifyHelmet, {
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      xContentTypeOptions: true,
      xFrameOptions: { action: 'deny' },
      xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
      xDownloadOptions: true,
      xDnsPrefetchControl: { allow: false },
      hidePoweredBy: true,
    });

    await this.fastifyServer.register(fastifyRateLimit, {
      global: true,
      max: this.config.rateLimit.global.max,
      timeWindow: this.config.rateLimit.global.timeWindow,
      cache: 10000,
      skipOnError: false,
      keyGenerator: (request) => request.ip,
    });

    const skipRequestLog = (request: FastifyRequest): boolean => {
      const isOptions = request.method === 'OPTIONS';
      const isHealthCheck = request.url === '/health/live' || request.url === '/health/ready';
      return isOptions || isHealthCheck;
    };

    this.fastifyServer.addHook('onRequest', (request, reply, done) => {
      if (skipRequestLog(request)) {
        done();
        return;
      }

      const requestId = IdService.generateUuid();
      request.id = requestId;
      reply.header('X-Request-ID', requestId);

      this.activeConnections++;

      this.loggerService.debug({
        message: 'Incoming HTTP request',
        event: 'http.request.start',
        requestId: request.id,
        method: request.method,
        url: request.url,
      });

      done();
    });

    this.fastifyServer.addHook('onSend', (request, reply, _payload, done) => {
      if (skipRequestLog(request)) {
        done();
        return;
      }

      this.loggerService.debug({
        message: 'Request completed',
        event: 'http.request.end',
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        userId: request.user?.userId,
      });

      done();
    });

    this.fastifyServer.addHook('onResponse', (_request, _reply, done) => {
      this.activeConnections--;
      done();
    });

    this.fastifyServer.setSerializerCompiler(() => {
      return (data): string => JSON.stringify(data);
    });

    this.fastifyServer.addHook('preHandler', async (request, reply) => {
      if (
        request.body &&
        typeof request.body === 'object' &&
        request.headers['content-type']?.includes('application/json')
      ) {
        try {
          request.body = this.sanitizeInput(request.body, 0);
        } catch (error) {
          this.loggerService.warn({
            message: 'Input sanitization failed',
            event: 'http.request.input_sanitization_failed',
            requestId: request.id,
            method: request.method,
            url: request.url,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          return reply.status(400).send({
            name: 'InputNotValidError',
            message: 'Invalid input: object too deep or string too long',
          });
        }
      }
    });

    await this.registerRoutes();

    await this.fastifyServer.listen({ port, host });

    this.loggerService.info({ message: 'HTTP server started', port, host });
  }

  public async stop(): Promise<void> {
    if (this.isShuttingDown) {
      this.loggerService.warn({ message: 'HTTP server is already shutting down' });
      return;
    }

    this.isShuttingDown = true;

    this.loggerService.info({ message: 'Stopping HTTP server' });

    // Stop accepting new connections
    this.fastifyServer.server.unref();

    // Wait for active connections to finish (with timeout)
    const shutdownTimeout = 30000; // 30s
    const shutdownStart = Date.now();

    while (this.activeConnections > 0 && Date.now() - shutdownStart < shutdownTimeout) {
      this.loggerService.info({
        message: 'Waiting for active connections to finish',
        activeConnections: this.activeConnections,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.activeConnections > 0) {
      this.loggerService.warn({
        message: 'Forcing shutdown with active connections',
        activeConnections: this.activeConnections,
      });
    }

    await this.fastifyServer.close();

    this.loggerService.info({ message: 'HTTP server stopped' });
  }

  private setupErrorHandler(): void {
    this.fastifyServer.setSchemaErrorFormatter((errors, dataVar) => {
      const { instancePath, message } = errors[0] as FastifySchemaValidationError;

      return new InputNotValidError({
        reason: `${dataVar}${instancePath} ${message || 'error'}`,
        value: undefined,
      });
    });

    this.fastifyServer.setErrorHandler((error, request, reply) => {
      const requestId = request.id;
      const baseContext = {
        requestId,
        method: request.method,
        url: request.url,
        userId: request.user?.userId,
        ip: request.ip,
      };

      // Handle TypeError (unexpected runtime errors)
      if (error instanceof TypeError) {
        this.loggerService.error({
          message: 'HTTP request type error',
          event: 'http.request.type_error',
          ...baseContext,
          err: error,
        });

        return reply.status(500).send({
          name: 'InternalServerError',
          message: 'Internal server error',
        });
      }

      // Handle rate limiting
      if (error instanceof Error && 'statusCode' in error && error.statusCode === 429) {
        this.loggerService.warn({
          message: 'Rate limit exceeded',
          event: 'http.request.rate_limited',
          ...baseContext,
        });

        return reply.status(429).send({
          name: 'TooManyRequestsError',
          message: error.message || 'Rate limit exceeded',
        });
      }

      const responseError = this.sanitizeErrorResponse(error);

      // Handle authentication errors (warn level - expected in normal operation)
      if (error instanceof UnauthorizedAccessError) {
        this.loggerService.warn({
          message: 'Unauthorized access attempt',
          event: 'http.request.unauthorized',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(401).send(responseError);
      }

      // Handle authorization errors (warn level - expected in normal operation)
      if (error instanceof ForbiddenAccessError) {
        this.loggerService.warn({
          message: 'Forbidden access attempt',
          event: 'http.request.forbidden',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(403).send(responseError);
      }

      // Handle validation errors (warn level - client errors)
      if (error instanceof InputNotValidError) {
        this.loggerService.warn({
          message: 'Invalid input',
          event: 'http.request.validation_error',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(400).send(responseError);
      }

      // Handle business logic errors (warn level - expected domain errors)
      if (error instanceof OperationNotValidError) {
        this.loggerService.warn({
          message: 'Invalid operation',
          event: 'http.request.operation_error',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(400).send(responseError);
      }

      // Handle not found errors (info level - common in normal operation)
      if (error instanceof ResourceNotFoundError) {
        this.loggerService.info({
          message: 'Resource not found',
          event: 'http.request.not_found',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(404).send(responseError);
      }

      // Handle conflict errors (warn level - client errors)
      if (error instanceof ResourceAlreadyExistsError) {
        this.loggerService.warn({
          message: 'Resource conflict',
          event: 'http.request.conflict',
          ...baseContext,
          errorContext: error.context,
        });

        return reply.status(409).send(responseError);
      }

      // Handle external service errors (error level - infrastructure issues)
      if (error instanceof ExternalServiceError) {
        this.loggerService.error({
          message: 'External service error',
          event: 'http.request.external_service_error',
          ...baseContext,
          err: error,
        });

        return reply.status(502).send(responseError);
      }

      // Handle unexpected errors (error level - needs investigation)
      this.loggerService.error({
        message: 'Unexpected error',
        event: 'http.request.unexpected_error',
        ...baseContext,
        err: error,
      });

      return reply.status(500).send({
        name: 'InternalServerError',
        message: 'Internal server error',
      });
    });
  }

  private sanitizeErrorResponse(errorRaw: unknown): Record<string, unknown> {
    const error = serializeError(errorRaw);
    const allowedFields = ['name', 'message'];
    const sanitized: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in error) {
        sanitized[field] = error[field];
      }
    }

    if (error['context'] && typeof error['context'] === 'object') {
      const context = error['context'] as Record<string, unknown>;
      const safeContext: Record<string, unknown> = {};

      const allowedContextFields = ['reason', 'value', 'field'];

      for (const field of allowedContextFields) {
        if (field in context) {
          safeContext[field] = context[field];
        }
      }

      if (Object.keys(safeContext).length > 0) {
        sanitized['context'] = safeContext;
      }
    }

    return sanitized;
  }

  private sanitizeInput(obj: unknown, depth: number): unknown {
    // Prevent deeply nested objects (DoS protection)
    if (depth > maxObjectDepth) {
      throw new Error(`Object nesting exceeds maximum depth of ${String(maxObjectDepth)}`);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeInput(item, depth + 1));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        sanitized[key] = this.sanitizeInput(value, depth + 1);
      }

      return sanitized;
    }

    if (typeof obj === 'string') {
      // Prevent extremely long strings (DoS protection)
      if (obj.length > maxStringLength) {
        throw new Error(`String length exceeds maximum of ${String(maxStringLength)} characters`);
      }

      return obj.trim();
    }

    return obj;
  }

  private async registerRoutes(): Promise<void> {
    const tokenService = new TokenService(this.config);
    const openRouterService = new OpenRouterService(this.config.openRouter, this.loggerService);

    await this.fastifyServer.register(healthRoutes, {
      config: this.config,
      loggerService: this.loggerService,
      databaseClient: this.databaseClient,
      tokenService,
    });

    await this.fastifyServer.register(userRoutes, {
      databaseClient: this.databaseClient,
      config: this.config,
      loggerService: this.loggerService,
      tokenService,
    });

    await this.fastifyServer.register(seriesRoutes, {
      config: this.config,
      loggerService: this.loggerService,
      tokenService,
      databaseClient: this.databaseClient,
    });

    await this.fastifyServer.register(watchroomRoutes, {
      databaseClient: this.databaseClient,
      tokenService,
      loggerService: this.loggerService,
      config: this.config,
    });

    await this.fastifyServer.register(recommendationRoutes, {
      databaseClient: this.databaseClient,
      tokenService,
      loggerService: this.loggerService,
      openRouterService,
      config: this.config,
    });
  }
}

import { ExternalServiceError } from '../errors/externalServiceError.ts';
import { InputNotValidError } from '../errors/inputNotValidError.ts';
import type { LoggerService } from '../logger/loggerService.ts';

import type { ResponseFormat, OpenRouterResponse, StructuredResponse, OpenRouterRequest, Message } from './types.ts';

export interface OpenRouterConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly maxMessageLength: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly requestTimeoutMs: number;
  readonly maxRetryDelayMs: number;
}

export interface SendRequestParams {
  readonly userMessage: string;
  readonly systemMessage: string;
  readonly responseFormat: ResponseFormat;
}

export class OpenRouterService {
  private readonly config: OpenRouterConfig;
  private readonly logger: LoggerService;

  public constructor(config: OpenRouterConfig, logger: LoggerService) {
    this.config = config;
    this.logger = logger;
  }

  public async sendRequest<Response = Record<string, unknown>>(
    params: SendRequestParams,
  ): Promise<StructuredResponse<Response>> {
    const { userMessage, systemMessage, responseFormat } = params;

    const payload = this.preparePayload(userMessage, systemMessage, responseFormat);

    this.logger.debug({
      message: 'Sending request to OpenRouter API',
      model: this.config.model,
      userMessageLength: userMessage.length,
      systemMessageLength: systemMessage.length,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    const startTime = Date.now();

    try {
      const response = await this.executeRequestWithRetry(payload);
      const duration = Date.now() - startTime;

      this.logger.info({
        message: 'OpenRouter API request successful',
        duration,
        model: this.config.model,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        tokensPerSecond: Math.round((response.usage.completion_tokens / duration) * 1000),
        estimatedCost: this.estimateCost(response.usage.prompt_tokens, response.usage.completion_tokens),
      });

      return this.formatResponse(response);
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof ExternalServiceError) {
        this.logger.error({
          message: 'OpenRouter API request failed',
          duration,
          reason: error.context['reason'],
          service: error.context.service,
        });
      } else {
        this.logger.error({
          message:
            error instanceof Error
              ? 'Unexpected error during OpenRouter API request'
              : 'Unknown error during OpenRouter API request',
          duration,
          error: error instanceof Error ? error.message : String(error),
          ...(error instanceof Error && error.stack && { stack: error.stack }),
        });
      }

      throw error;
    }
  }

  private formatResponse<T = Record<string, unknown>>(rawResponse: OpenRouterResponse): StructuredResponse<T> {
    const firstChoice = rawResponse.choices[0];

    if (!firstChoice) {
      throw new ExternalServiceError({
        service: 'OpenRouter API',
        reason: 'No choices returned in response',
        responseBody: rawResponse,
      });
    }

    const messageContent = firstChoice.message.content;

    if (!messageContent) {
      throw new ExternalServiceError({
        service: 'OpenRouter API',
        reason: 'No content in response message',
        responseBody: rawResponse,
      });
    }

    try {
      const parsedData = JSON.parse(messageContent) as T;

      const result: StructuredResponse<T> = {
        data: parsedData,
        usage: {
          promptTokens: rawResponse.usage.prompt_tokens,
          completionTokens: rawResponse.usage.completion_tokens,
          totalTokens: rawResponse.usage.total_tokens,
        },
      };

      this.logger.debug({
        message: 'Response formatted successfully',
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Failed to parse response',
        error: error instanceof Error ? error.message : 'Unknown error',
        content: messageContent,
      });

      throw new ExternalServiceError({
        service: 'OpenRouter API',
        reason: 'Failed to parse response content as JSON',
        originalError: error,
        responseBody: messageContent,
      });
    }
  }

  private preparePayload(
    userMessage: string,
    systemMessage: string,
    responseFormat: ResponseFormat,
  ): OpenRouterRequest {
    const messages: Message[] = [];

    this.validateInput(systemMessage);
    messages.push({
      role: 'system',
      content: systemMessage,
    });

    this.validateInput(userMessage);
    messages.push({
      role: 'user',
      content: userMessage,
    });

    return {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      response_format: responseFormat,
    };
  }

  private async executeRequestWithRetry(payload: OpenRouterRequest): Promise<OpenRouterResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.executeRequest(payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === this.config.maxRetries) {
          this.logger.error({
            message: 'Request failed after retries',
            attempt,
            maxRetries: this.config.maxRetries,
            isRetryable,
            error: lastError.message,
          });
          throw error;
        }

        const delayMs = this.calculateRetryDelay(attempt);

        this.logger.warn({
          message: 'Request failed, retrying...',
          attempt,
          maxRetries: this.config.maxRetries,
          delayMs,
          error: lastError.message,
        });

        await this.sleep(delayMs);
      }
    }

    throw lastError ?? new Error('Unknown error during request retry');
  }

  private async executeRequest(payload: OpenRouterRequest): Promise<OpenRouterResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.config.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();

        throw new ExternalServiceError({
          service: 'OpenRouter API',
          reason: `OpenRouter API request failed with status ${response.status.toString()}`,
          responseBody: errorBody,
          statusCode: response.status,
        });
      }

      const data = (await response.json()) as OpenRouterResponse;

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExternalServiceError({
          service: 'OpenRouter API',
          reason: `Request timeout after ${this.config.requestTimeoutMs.toString()}ms`,
          timeoutMs: this.config.requestTimeoutMs,
        });
      }

      throw error;
    }
  }

  private validateInput(userMessage: string): void {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new InputNotValidError({
        reason: 'Message cannot be empty',
        value: userMessage,
      });
    }

    if (userMessage.length > this.config.maxMessageLength) {
      throw new InputNotValidError({
        reason: `Message length exceeds maximum allowed (${this.config.maxMessageLength.toString()} characters)`,
        value: userMessage.length,
      });
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof ExternalServiceError) {
      const statusCode = error.context['statusCode'];

      // Retry on rate limits, server errors, and timeouts
      if (typeof statusCode === 'number') {
        return statusCode === 429 || statusCode === 503 || statusCode === 504 || statusCode >= 500;
      }
    }

    // Retry on network errors
    if (error instanceof Error) {
      const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'];
      return networkErrors.some((code) => error.message.includes(code));
    }

    return false;
  }

  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = this.config.retryDelayMs * Math.pow(2, attempt - 1);

    // Cap at maximum retry delay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxRetryDelayMs);

    // Add jitter (±20%) to prevent thundering herd
    const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);

    const finalDelay = Math.floor(cappedDelay + jitter);

    return Math.max(0, finalDelay); // Ensure non-negative
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private estimateCost(promptTokens: number, completionTokens: number): string {
    // Approximate pricing for common models (in USD per 1M tokens)
    const modelPricing: Record<string, { prompt: number; completion: number }> = {
      'anthropic/claude-3.5-sonnet': { prompt: 3.0, completion: 15.0 },
      'anthropic/claude-3-opus': { prompt: 15.0, completion: 75.0 },
      'openai/gpt-4o': { prompt: 2.5, completion: 10.0 },
    };

    const pricing = modelPricing[this.config.model];

    if (!pricing) {
      return 'unknown';
    }

    const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * pricing.completion;
    const totalCost = promptCost + completionCost;

    return `$${totalCost.toFixed(6)}`;
  }
}

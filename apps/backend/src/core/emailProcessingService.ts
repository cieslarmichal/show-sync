import type { EmailService } from '../common/emailService/emailService.ts';
import { BaseError } from '../common/errors/baseError.ts';
import type { LoggerService } from '../common/logger/loggerService.ts';
import type { EmailRepository } from '../modules/user/domain/repositories/emailRepository.ts';
import type { Email } from '../modules/user/domain/types/email.ts';

export class EmailProcessingService {
  private readonly emailRepository: EmailRepository;
  private readonly emailService: EmailService;
  private readonly loggerService: LoggerService;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;
  private readonly maxRetries: number;
  private readonly retryAttempts = new Map<string, number>();

  public constructor(
    emailRepository: EmailRepository,
    emailService: EmailService,
    loggerService: LoggerService,
    intervalMs = 5000,
    maxRetries = 5,
  ) {
    this.emailRepository = emailRepository;
    this.emailService = emailService;
    this.loggerService = loggerService;
    this.intervalMs = intervalMs;
    this.maxRetries = maxRetries;
  }

  public start(): void {
    if (this.intervalId) {
      this.loggerService.warn({ message: 'Email processing service is already running' });
      return;
    }

    this.loggerService.info({
      message: 'Starting email processing service',
      intervalMs: this.intervalMs,
      maxRetries: this.maxRetries,
    });

    this.intervalId = setInterval(() => {
      this.processEmails().catch((error: unknown) => {
        this.loggerService.error({
          message: 'Error processing emails',
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.retryAttempts.clear();
      this.loggerService.info({ message: 'Email processing service stopped' });
    }
  }

  private async processEmails(): Promise<void> {
    try {
      const pendingEmails = await this.emailRepository.findAllPending();

      if (pendingEmails.length === 0) {
        return;
      }

      this.loggerService.debug({
        message: 'Processing pending emails',
        count: pendingEmails.length,
      });

      for (const email of pendingEmails) {
        await this.processEmail(email);
      }
    } catch (error) {
      this.loggerService.error({
        message: 'Failed to fetch pending emails',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async processEmail(email: Email): Promise<void> {
    const currentAttempts = this.retryAttempts.get(email.id) || 0;

    if (currentAttempts >= this.maxRetries) {
      this.loggerService.warn({
        message: 'Max retries reached for email, marking as failed',
        emailId: email.id,
        attempts: currentAttempts,
      });

      await this.emailRepository.updateStatus(email.id, 'failed');
      this.retryAttempts.delete(email.id);
      return;
    }

    try {
      const emailData = JSON.parse(email.payload);

      this.loggerService.debug({
        message: 'Sending email',
        emailId: email.id,
        recipient: email.recipient,
        template: email.templateName,
        attempt: currentAttempts + 1,
      });

      await this.emailService.sendEmail({
        toEmail: email.recipient,
        template: {
          name: email.templateName,
          data: emailData,
        },
      });

      await this.emailRepository.updateStatus(email.id, 'sent');

      this.retryAttempts.delete(email.id);

      this.loggerService.info({
        message: 'Email sent successfully',
        emailId: email.id,
        recipient: email.recipient,
        template: email.templateName,
      });
    } catch (error: unknown) {
      const nextAttempts = currentAttempts + 1;
      this.retryAttempts.set(email.id, nextAttempts);

      this.loggerService.error({
        message: 'Failed to send email',
        emailId: email.id,
        recipient: email.recipient,
        template: email.templateName,
        attempt: nextAttempts,
        error: error instanceof BaseError ? error.context : String(error),
      });

      if (nextAttempts >= this.maxRetries) {
        await this.emailRepository.updateStatus(email.id, 'failed');
        this.retryAttempts.delete(email.id);
      }
    }
  }
}

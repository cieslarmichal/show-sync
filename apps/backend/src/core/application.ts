import { EmailServiceImpl } from '../common/emailService/emailServiceImpl.ts';
import { LoggerServiceFactory } from '../common/logger/loggerServiceFactory.ts';
import { DatabaseClient } from '../infrastructure/database/databaseClient.ts';
import { EmailRepositoryImpl } from '../modules/user/infrastructure/repositories/emailRepositoryImpl.ts';

import { createConfig } from './config.ts';
import { EmailProcessingService } from './emailProcessingService.ts';
import { HttpServer } from './httpServer.ts';

export class Application {
  private static server: HttpServer | undefined;
  private static databaseClient: DatabaseClient | undefined;
  private static emailProcessingService: EmailProcessingService | undefined;

  public static async start(): Promise<void> {
    const config = createConfig();

    const loggerService = LoggerServiceFactory.create({ logLevel: config.logLevel });

    this.databaseClient = new DatabaseClient(config.database, loggerService);

    await this.databaseClient.testConnection();

    const emailRepository = new EmailRepositoryImpl(this.databaseClient);
    const emailService = new EmailServiceImpl(config);
    this.emailProcessingService = new EmailProcessingService(emailRepository, emailService, loggerService);

    this.emailProcessingService.start();

    this.server = new HttpServer(config, loggerService, this.databaseClient);

    await this.server.start();
  }

  public static async stop(): Promise<void> {
    this.emailProcessingService?.stop();
    await this.server?.stop();
    await this.databaseClient?.close();
  }
}

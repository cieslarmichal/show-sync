import { fakerPL as faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';

import type { Language } from '../src/common/types/language.ts';
import type { DatabaseClient } from '../src/infrastructure/database/databaseClient.ts';
import { users } from '../src/infrastructure/database/schema.ts';
import type { CreateUserData } from '../src/modules/user/domain/repositories/userRepository.ts';
import type { User } from '../src/modules/user/domain/types/user.ts';

export class Generator {
  public static email(): string {
    return faker.internet.email().toLowerCase();
  }

  public static number(min = 0, max = 100, precision = 1): number {
    return faker.number.float({
      min,
      max,
      multipleOf: precision,
    });
  }

  public static string(length: number): string {
    return faker.string.sample(length);
  }

  public static alphaString(length: number, casing: 'lower' | 'upper' = 'lower'): string {
    return faker.string.alpha({
      casing,
      length,
    });
  }

  public static numericString(length: number): string {
    return faker.string.numeric({
      length,
    });
  }

  public static uuid(): string {
    return uuidv7();
  }

  public static arrayElement<T>(array: T[]): T {
    return faker.helpers.arrayElement(array);
  }

  public static firstName(): string {
    return faker.person.firstName();
  }

  public static lastName(): string {
    return faker.person.lastName();
  }

  public static centPrice(): number {
    return Generator.number(10000, 100000);
  }

  public static phone(): string {
    return faker.phone.number({ style: 'international' });
  }

  public static word(): string {
    return faker.lorem.word();
  }

  public static boolean(): boolean {
    return faker.datatype.boolean();
  }

  public static password(): string {
    let password = faker.internet.password({ length: 13 });

    password += Generator.alphaString(1, 'upper');

    password += Generator.alphaString(1, 'lower');

    password += Generator.numericString(1);

    password += '!';

    return password;
  }

  public static sentences(count = 3): string {
    return faker.lorem.sentences(count);
  }

  public static words(count = 3): string {
    return faker.lorem.words(count);
  }

  public static futureDate(): Date {
    return faker.date.future();
  }

  public static soonDate(refDate: Date): Date {
    return faker.date.soon({
      days: 3,
      refDate,
    });
  }

  public static pastDate(): Date {
    return faker.date.past();
  }

  public static imageUrl(width = 200, height = 120): string {
    return faker.image.url({
      width,
      height,
    });
  }

  public static language(): Language {
    return this.arrayElement<Language>(['en', 'pl']);
  }

  public static userData(input?: Partial<CreateUserData>): CreateUserData & { password: string } {
    const defaultPassword = Generator.password();
    const password = input?.password ?? defaultPassword;

    return {
      name: faker.person.fullName(),
      email: Generator.email(),
      isEmailVerified: true,
      language: Generator.language(),
      ...input,
      password: password || defaultPassword,
    };
  }

  public static async user(input: {
    databaseClient: DatabaseClient;
    email?: string;
    password?: string | null;
    name?: string;
    oauthProvider?: string | null;
    oauthProviderId?: string | null;
    isEmailVerified?: boolean;
    language?: Language;
  }): Promise<User> {
    const [user] = await input.databaseClient.db
      .insert(users)
      .values({
        id: Generator.uuid(),
        name: input.name || faker.person.fullName(),
        email: input.email || Generator.email(),
        password: input.password !== undefined ? input.password : Generator.password(),
        oauthProvider: input.oauthProvider || null,
        oauthProviderId: input.oauthProviderId || null,
        isEmailVerified: input.isEmailVerified !== undefined ? input.isEmailVerified : true,
        language: input.language || Generator.language(),
      })
      .returning();

    if (!user) {
      throw new Error('Failed to create user');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      oauthProvider: user.oauthProvider,
      oauthProviderId: user.oauthProviderId,
      isEmailVerified: user.isEmailVerified,
      language: user.language as Language,
      createdAt: user.createdAt,
    };
  }
}

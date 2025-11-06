import type { Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class LoginPageModel extends BasePageModel {
  override readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  get emailInput() {
    return this.page.getByLabel('Email Address');
  }

  get passwordInput() {
    return this.page.getByLabel('Password', { exact: true });
  }

  get loginButton() {
    return this.page.getByTestId('login-submit-button');
  }

  get forgotPasswordLink() {
    return this.page.getByRole('link', { name: /forgot your password/i });
  }

  get signUpLink() {
    return this.page.getByRole('link', { name: /sign up/i });
  }

  get fieldErrorMessage() {
    return this.page.locator('[data-slot="form-message"]').first();
  }

  get formErrorMessage() {
    return this.page.locator('div.text-destructive.text-sm').filter({ hasText: /invalid email|password/i });
  }

  get errorMessage() {
    return this.formErrorMessage;
  }

  override async goto(): Promise<void> {
    await super.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.loginButton.click();
  }

  async clickSignUpLink(): Promise<void> {
    await this.signUpLink.click();
  }

  async clickForgotPasswordLink(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.getTextContent(this.errorMessage);
  }

  async hasErrorMessage(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }
}

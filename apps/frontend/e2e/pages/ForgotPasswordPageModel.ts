import type { Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class ForgotPasswordPageModel extends BasePageModel {
  override readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  get emailInput() {
    return this.page.getByLabel('Email Address');
  }

  get submitButton() {
    return this.page.getByTestId('reset-password-submit-button');
  }

  get backToLoginButton() {
    return this.page.getByTestId('back-to-login-button');
  }

  get signInLink() {
    return this.page.getByRole('link', { name: /sign in/i });
  }

  get fieldErrorMessage() {
    return this.page.locator('[data-slot="form-message"]').first();
  }

  get formErrorMessage() {
    return this.page.locator('div.text-destructive.text-sm');
  }

  get errorMessage() {
    return this.fieldErrorMessage;
  }

  get successMessage() {
    return this.page.locator('text=If an account exists with the email you provided');
  }

  override async goto(): Promise<void> {
    await super.goto('/forgot-password');
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.fillField(this.emailInput, email);
    await this.submitButton.click();
  }

  async clickSignInLink(): Promise<void> {
    await this.signInLink.click();
  }

  async clickBackToLoginButton(): Promise<void> {
    await this.backToLoginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.getTextContent(this.errorMessage);
  }

  async hasErrorMessage(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  async hasSuccessMessage(): Promise<boolean> {
    return this.isVisible(this.successMessage);
  }
}

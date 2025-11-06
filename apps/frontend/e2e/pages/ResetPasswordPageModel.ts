import type { Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class ResetPasswordPageModel extends BasePageModel {
  override readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  get newPasswordInput() {
    return this.page.getByLabel('New Password');
  }

  get confirmPasswordInput() {
    return this.page.getByLabel('Confirm Password');
  }

  get submitButton() {
    return this.page.getByTestId('reset-password-button');
  }

  get requestNewLinkButton() {
    return this.page.getByTestId('request-new-link-button');
  }

  get backToLoginButton() {
    return this.page.getByTestId('back-to-login-button');
  }

  get goToLoginButton() {
    return this.page.getByTestId('go-to-login-button');
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

  get validatingMessage() {
    return this.page.locator('text=Verifying your reset link...');
  }

  get invalidTokenHeading() {
    return this.page.locator('text=Invalid Reset Link');
  }

  get successHeading() {
    return this.page.locator('text=Password Reset Successful');
  }

  get setPasswordHeading() {
    return this.page.locator('text=Set New Password');
  }

  override async goto(token?: string): Promise<void> {
    const url = token ? `/reset-password?token=${token}` : '/reset-password';
    await super.goto(url);
  }

  async resetPassword(newPassword: string, confirmPassword: string): Promise<void> {
    await this.fillField(this.newPasswordInput, newPassword);
    await this.fillField(this.confirmPasswordInput, confirmPassword);
    await this.submitButton.click();
  }

  async clickRequestNewLink(): Promise<void> {
    await this.requestNewLinkButton.click();
  }

  async clickBackToLogin(): Promise<void> {
    await this.backToLoginButton.click();
  }

  async clickGoToLogin(): Promise<void> {
    await this.goToLoginButton.click();
  }

  async clickSignInLink(): Promise<void> {
    await this.signInLink.click();
  }

  async isValidating(): Promise<boolean> {
    return this.isVisible(this.validatingMessage);
  }

  async isInvalidToken(): Promise<boolean> {
    return this.isVisible(this.invalidTokenHeading);
  }

  async isSuccess(): Promise<boolean> {
    return this.isVisible(this.successHeading);
  }

  async isSetPasswordForm(): Promise<boolean> {
    return this.isVisible(this.setPasswordHeading);
  }

  async getErrorMessage(): Promise<string> {
    const fieldError = await this.isVisible(this.fieldErrorMessage);
    if (fieldError) {
      return this.getTextContent(this.fieldErrorMessage);
    }
    return this.getTextContent(this.formErrorMessage);
  }

  async hasErrorMessage(): Promise<boolean> {
    const fieldError = await this.isVisible(this.fieldErrorMessage);
    const formError = await this.isVisible(this.formErrorMessage);
    return fieldError || formError;
  }
}

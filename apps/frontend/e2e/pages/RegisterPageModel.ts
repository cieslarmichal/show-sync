import type { Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class RegisterPageModel extends BasePageModel {
  override readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  get nameInput() {
    return this.page.getByLabel('Name');
  }

  get emailInput() {
    return this.page.getByLabel('Email address');
  }

  get passwordInput() {
    return this.page.getByLabel('Password', { exact: true });
  }

  get repeatPasswordInput() {
    return this.page.getByLabel('Repeat Password');
  }

  get registerButton() {
    return this.page.getByTestId('register-submit-button');
  }

  get backToSignInButton() {
    return this.page.getByTestId('back-to-sign-in-button');
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

  override async goto(): Promise<void> {
    await super.goto('/register');
  }

  async register(name: string, email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.fillField(this.nameInput, name);
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.fillField(this.repeatPasswordInput, confirmPassword || password);
    await this.registerButton.click();
  }

  async clickSignInLink(): Promise<void> {
    await this.signInLink.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.getTextContent(this.errorMessage);
  }

  async hasErrorMessage(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }
}

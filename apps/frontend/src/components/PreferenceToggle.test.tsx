import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent } from '@/tests/testUtils';
import { PreferenceToggle } from './PreferenceToggle';

describe('PreferenceToggle', () => {
  it('should render with like preference (outline heart)', async () => {
    const onToggle = vi.fn();
    await renderWithProviders(
      <PreferenceToggle
        preferenceLevel="like"
        onToggle={onToggle}
      />,
    );

    const button = screen.getByRole('button', { name: /mark as loved/i });
    expect(button).toBeInTheDocument();
  });

  it('should render with love preference (filled heart)', async () => {
    const onToggle = vi.fn();
    await renderWithProviders(
      <PreferenceToggle
        preferenceLevel="love"
        onToggle={onToggle}
      />,
    );

    const button = screen.getByRole('button', { name: /mark as liked/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onToggle with love when clicking like button', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    await renderWithProviders(
      <PreferenceToggle
        preferenceLevel="like"
        onToggle={onToggle}
      />,
    );

    const button = screen.getByRole('button', { name: /mark as loved/i });
    await user.click(button);

    expect(onToggle).toHaveBeenCalledWith('love');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onToggle with like when clicking love button', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    await renderWithProviders(
      <PreferenceToggle
        preferenceLevel="love"
        onToggle={onToggle}
      />,
    );

    const button = screen.getByRole('button', { name: /mark as liked/i });
    await user.click(button);

    expect(onToggle).toHaveBeenCalledWith('like');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', async () => {
    const onToggle = vi.fn();

    await renderWithProviders(
      <PreferenceToggle
        preferenceLevel="like"
        onToggle={onToggle}
        disabled={true}
      />,
    );

    const button = screen.getByRole('button', { name: /mark as loved/i });
    expect(button).toBeDisabled();
  });

  it('should not call onToggle when disabled and clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    await renderWithProviders(
      <PreferenceToggle
        preferenceLevel="like"
        onToggle={onToggle}
        disabled={true}
      />,
    );

    const button = screen.getByRole('button', { name: /mark as loved/i });
    await user.click(button);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    await renderWithProviders(
      <PreferenceToggle
        preferenceLevel="like"
        onToggle={onToggle}
      />,
    );

    const button = screen.getByRole('button', { name: /mark as loved/i });
    await user.hover(button);

    // Tooltip should appear with text about changing preference (use queryAllByText to handle duplicates)
    const tooltips = await screen.findAllByText(/liked.*click to change to love/i);
    expect(tooltips.length).toBeGreaterThan(0);
  });
});

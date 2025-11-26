import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateWatchRoomModal } from './CreateWatchRoomModal';

// Mock the API query
vi.mock('../api/queries/watchroom', () => ({
  createWatchroom: vi.fn(),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { createWatchroom } from '../api/queries/watchroom';
import { toast } from 'sonner';

describe('CreateWatchRoomModal', () => {
  const mockOnRoomCreated = vi.fn();
  const mockCreateWatchroom = vi.mocked(createWatchroom);
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render create room button', () => {
    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    expect(screen.getByRole('button', { name: /create watch room/i })).toBeInTheDocument();
  });

  it('should open modal when create room button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Get TV show suggestions based on what you like.')).toBeInTheDocument();
    });
  });

  it('should render form fields when modal is open', async () => {
    const user = userEvent.setup();
    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for empty name', async () => {
    const user = userEvent.setup();
    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should show validation error for name exceeding 64 characters', async () => {
    const user = userEvent.setup();
    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'a'.repeat(65));

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at most 64 characters')).toBeInTheDocument();
    });
  });

  it('should show validation error for description exceeding 256 characters', async () => {
    const user = userEvent.setup();
    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'Test Room');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'a'.repeat(257));

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Description must be at most 256 characters')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockCreateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Test Room',
      description: 'Test Description',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      availablePlatforms: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'Test Room');
    await user.type(descriptionInput, 'Test Description');

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateWatchroom).toHaveBeenCalledWith({
        name: 'Test Room',
        description: 'Test Description',
        availablePlatforms: [],
        seriesLengthPreference: 'all',
      });
    });
  });

  it('should call onRoomCreated callback after successful submission', async () => {
    const user = userEvent.setup();
    mockCreateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Test Room',
      description: 'Test Description',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      availablePlatforms: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'Test Room');

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnRoomCreated).toHaveBeenCalled();
    });
  });

  it('should show success toast after successful submission', async () => {
    const user = userEvent.setup();
    mockCreateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Test Room',
      description: 'Test Description',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      availablePlatforms: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'Test Room');

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Watch room created successfully!');
    });
  });

  it('should show error toast when submission fails', async () => {
    const user = userEvent.setup();
    mockCreateWatchroom.mockRejectedValue(new Error('Failed to create'));

    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'Test Room');

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Could not create watch room. Try a different name or try again later.',
      );
    });
  });

  it('should close modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should show submitting state during form submission', async () => {
    const user = userEvent.setup();
    mockCreateWatchroom.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'Test Room');

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
    });
  });

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup();
    mockCreateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Test Room',
      description: 'Test Description',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      availablePlatforms: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'Test Room');

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnRoomCreated).toHaveBeenCalled();
    });

    // Reopen modal to check if form is reset
    const createButtonAgain = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButtonAgain);

    await waitFor(() => {
      const nameInputAgain = screen.getByLabelText(/room name/i) as HTMLInputElement;
      expect(nameInputAgain.value).toBe('');
    });
  });

  it('should submit with undefined description when description is empty', async () => {
    const user = userEvent.setup();
    mockCreateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Test Room',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      availablePlatforms: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<CreateWatchRoomModal onRoomCreated={mockOnRoomCreated} />);

    const createButton = screen.getByRole('button', { name: /create watch room/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.type(nameInput, 'Test Room');

    const submitButton = screen.getByRole('button', { name: /^create watch room$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateWatchroom).toHaveBeenCalledWith({
        name: 'Test Room',
        description: undefined,
        availablePlatforms: [],
        seriesLengthPreference: 'all',
      });
    });
  });
});

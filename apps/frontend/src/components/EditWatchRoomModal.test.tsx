import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditWatchRoomModal } from './EditWatchRoomModal';

// Mock the API query
vi.mock('../api/queries/watchroom', () => ({
  updateWatchroom: vi.fn(),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { updateWatchroom } from '../api/queries/watchroom';
import { toast } from 'sonner';

describe('EditWatchRoomModal', () => {
  const mockOnRoomUpdated = vi.fn();
  const mockUpdateWatchroom = vi.mocked(updateWatchroom);
  const mockToast = vi.mocked(toast);

  const defaultProps = {
    watchroomId: '123',
    currentName: 'Test Room',
    currentDescription: 'Test Description',
    onRoomUpdated: mockOnRoomUpdated,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render edit room button', () => {
    render(<EditWatchRoomModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /edit room/i })).toBeInTheDocument();
  });

  it('should open modal when edit room button is clicked', async () => {
    const user = userEvent.setup();
    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Watch Room')).toBeInTheDocument();
    });
  });

  it('should render form fields with current values when modal is open', async () => {
    const user = userEvent.setup();
    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/room name/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

      expect(nameInput.value).toBe('Test Room');
      expect(descriptionInput.value).toBe('Test Description');
    });
  });

  it('should handle undefined description', async () => {
    const user = userEvent.setup();
    render(
      <EditWatchRoomModal
        watchroomId="123"
        currentName="Test Room"
        currentDescription={undefined}
        onRoomUpdated={mockOnRoomUpdated}
      />,
    );

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('');
    });
  });

  it('should show validation error for empty name', async () => {
    const user = userEvent.setup();
    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.clear(nameInput);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Room name is required')).toBeInTheDocument();
    });
  });

  it('should show validation error for name exceeding 64 characters', async () => {
    const user = userEvent.setup();
    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'a'.repeat(65));

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at most 64 characters')).toBeInTheDocument();
    });
  });

  it('should show validation error for description exceeding 256 characters', async () => {
    const user = userEvent.setup();
    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'a'.repeat(257));

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Description must be at most 256 characters')).toBeInTheDocument();
    });
  });

  it('should submit form with updated data', async () => {
    const user = userEvent.setup();
    mockUpdateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Updated Room',
      description: 'Updated Description',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Room');

    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated Description');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateWatchroom).toHaveBeenCalledWith('123', {
        name: 'Updated Room',
        description: 'Updated Description',
        seriesLengthPreference: 'all',
      });
    });
  });

  it('should call onRoomUpdated callback after successful submission', async () => {
    const user = userEvent.setup();
    mockUpdateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Updated Room',
      description: 'Updated Description',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnRoomUpdated).toHaveBeenCalled();
    });
  });

  it('should show success toast after successful submission', async () => {
    const user = userEvent.setup();
    mockUpdateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Updated Room',
      description: 'Updated Description',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Watch room updated successfully!');
    });
  });

  it('should show error toast when submission fails', async () => {
    const user = userEvent.setup();
    mockUpdateWatchroom.mockRejectedValue(new Error('Failed to update'));

    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update watch room. Please try again.');
    });
  });

  it('should close modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Watch Room')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Edit Watch Room')).not.toBeInTheDocument();
    });
  });

  it('should show saving state during form submission', async () => {
    const user = userEvent.setup();
    mockUpdateWatchroom.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });
  });

  it('should reset form to current values when reopening modal', async () => {
    const user = userEvent.setup();
    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/room name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Edit Watch Room')).not.toBeInTheDocument();
    });

    // Reopen modal
    const editButtonAgain = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButtonAgain);

    await waitFor(() => {
      const nameInputAgain = screen.getByLabelText(/room name/i) as HTMLInputElement;
      expect(nameInputAgain.value).toBe('Test Room');
    });
  });

  it('should submit with undefined description when description is empty', async () => {
    const user = userEvent.setup();
    mockUpdateWatchroom.mockResolvedValue({
      id: '123',
      name: 'Test Room',
      publicLinkId: 'abc123',
      ownerId: 'user123',
      createdAt: new Date().toISOString(),
      participants: [],
      ownerName: 'Test User',
      seriesLengthPreference: 'all' as const,
    });

    render(<EditWatchRoomModal {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: /edit room/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateWatchroom).toHaveBeenCalledWith('123', {
        name: 'Test Room',
        description: undefined,
        seriesLengthPreference: 'all',
      });
    });
  });
});

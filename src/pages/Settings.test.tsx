import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Settings from './Settings';
import { supabase } from '../lib/supabase';
import type { UserPreferences } from '../lib/enhanced-prompt-utils';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Settings Page', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };
  
  const mockPreferences: UserPreferences = {
    id: 'pref123',
    user_id: 'user123',
    writing_samples: [
      'This is my first writing sample.',
      'Here is another example of my writing style.'
    ],
    preferred_tone: 'professional',
    preferred_length: 'medium',
    custom_instructions: 'Always be concise',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSettings = (user = mockUser) => {
    return render(
      <BrowserRouter>
        <Settings user={user} />
      </BrowserRouter>
    );
  };

  it('should redirect to home if no user', () => {
    renderSettings(null);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should load user preferences on mount', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      })
    } as any);

    renderSettings();

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_preferences');
    });

    // Check if preferences are displayed
    expect(screen.getByText('This is my first writing sample.')).toBeInTheDocument();
    expect(screen.getByText('Here is another example of my writing style.')).toBeInTheDocument();
  });

  it('should create default preferences if none exist', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      }),
      insert: vi.fn().mockResolvedValue({ error: null })
    } as any);

    renderSettings();

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_preferences');
    });

    // Should show default empty state
    expect(screen.getByText(/No writing samples yet/i)).toBeInTheDocument();
  });

  it('should allow adding a new writing sample', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockPreferences, writing_samples: [] },
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    } as any);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText(/No writing samples yet/i)).toBeInTheDocument();
    });

    // Type new sample
    const textarea = screen.getByPlaceholderText(/Enter a writing sample/i);
    await user.type(textarea, 'This is my new writing sample.');

    // Click add button
    const addButton = screen.getByRole('button', { name: /add sample/i });
    await user.click(addButton);

    // Check if update was called
    expect(supabase.from).toHaveBeenCalledWith('user_preferences');
    const updateCall = vi.mocked(supabase.from).mock.results[1].value.update;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        writing_samples: ['This is my new writing sample.']
      })
    );
  });

  it('should allow deleting a writing sample', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    } as any);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText('This is my first writing sample.')).toBeInTheDocument();
    });

    // Click delete button for first sample
    const deleteButtons = screen.getAllByLabelText(/delete sample/i);
    await user.click(deleteButtons[0]);

    // Check if update was called with remaining sample
    const updateCall = vi.mocked(supabase.from).mock.results[1].value.update;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        writing_samples: ['Here is another example of my writing style.']
      })
    );
  });

  it('should update tone preference', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    } as any);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /tone/i })).toBeInTheDocument();
    });

    // Change tone
    const toneSelect = screen.getByRole('combobox', { name: /tone/i });
    await user.click(toneSelect);
    await user.click(screen.getByText('Casual'));

    // Save preferences
    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);

    // Check if update was called
    const updateCall = vi.mocked(supabase.from).mock.results[1].value.update;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        preferred_tone: 'casual'
      })
    );
  });

  it('should update length preference', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    } as any);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /length/i })).toBeInTheDocument();
    });

    // Change length
    const lengthSelect = screen.getByRole('combobox', { name: /length/i });
    await user.click(lengthSelect);
    await user.click(screen.getByText('Long'));

    // Save preferences
    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);

    // Check if update was called
    const updateCall = vi.mocked(supabase.from).mock.results[1].value.update;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        preferred_length: 'long'
      })
    );
  });

  it('should update custom instructions', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    } as any);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/additional instructions/i)).toBeInTheDocument();
    });

    // Update custom instructions
    const instructionsTextarea = screen.getByPlaceholderText(/additional instructions/i);
    await user.clear(instructionsTextarea);
    await user.type(instructionsTextarea, 'Use more code examples');

    // Save preferences
    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);

    // Check if update was called
    const updateCall = vi.mocked(supabase.from).mock.results[1].value.update;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_instructions: 'Use more code examples'
      })
    );
  });

  it('should show saving state while saving', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
        )
      })
    } as any);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
    });

    // Click save
    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);

    // Should show saving state
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    });
  });

  it('should handle save errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ 
          error: { message: 'Failed to save' } 
        })
      })
    } as any);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
    });

    // Click save
    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);

    // Should log error
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving preferences:',
        expect.objectContaining({ message: 'Failed to save' })
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
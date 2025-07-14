import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegenerationDropdown from './regeneration-dropdown';
import { supabase } from '../lib/supabase';
import type { RegenerationPreset, UserPreferences } from '../lib/enhanced-prompt-utils';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

describe('RegenerationDropdown', () => {
  const mockOnRegenerate = vi.fn();
  const mockUser = { id: 'user123', email: 'test@example.com' };
  
  const mockPresets: RegenerationPreset[] = [
    {
      id: '1',
      name: 'More Casual',
      description: 'Make it conversational',
      system_prompt_modifier: 'Be casual',
      user_prompt_modifier: 'Rewrite casually',
      temperature: 0.8,
      is_default: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'More Technical',
      description: 'Add technical depth',
      system_prompt_modifier: 'Be technical',
      user_prompt_modifier: 'Add technical details',
      temperature: 0.7,
      is_default: true,
      created_at: new Date().toISOString()
    }
  ];

  const mockUserPreferences: UserPreferences = {
    id: 'pref123',
    user_id: 'user123',
    writing_samples: ['Sample text'],
    preferred_tone: 'professional',
    preferred_length: 'medium',
    custom_instructions: 'Keep it simple',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render regenerate button', () => {
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
      />
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Regenerate')).toBeInTheDocument();
  });

  it('should show loading state when regenerating', () => {
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={true}
      />
    );
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Regenerating...')).toBeInTheDocument();
  });

  it('should load presets when user is provided', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockPresets,
          error: null
        })
      })
    } as any);

    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
        user={mockUser}
      />
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('regeneration_presets');
    });
  });

  it('should show dropdown menu with presets when clicked', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'regeneration_presets') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPresets,
              error: null
            })
          })
        } as any;
      }
      if (table === 'user_preferences') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserPreferences,
                error: null
              })
            })
          })
        } as any;
      }
      return {} as any;
    });

    const user = userEvent.setup();
    
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
        user={mockUser}
      />
    );

    // Wait for data to load
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('regeneration_presets');
    });

    // Click the dropdown button
    const button = screen.getByRole('button');
    await user.click(button);

    // Check if menu items are displayed
    await waitFor(() => {
      expect(screen.getByText('More Casual')).toBeInTheDocument();
      expect(screen.getByText('More Technical')).toBeInTheDocument();
      expect(screen.getByText('Use My Writing Style')).toBeInTheDocument();
      expect(screen.getByText('Custom Prompt...')).toBeInTheDocument();
    });
  });

  it('should call onRegenerate with preset when preset is selected', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'regeneration_presets') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPresets,
              error: null
            })
          })
        } as any;
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      } as any;
    });

    const user = userEvent.setup();
    
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
        user={mockUser}
      />
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('regeneration_presets');
    });

    // Open dropdown
    await user.click(screen.getByRole('button'));

    // Click on a preset
    await user.click(screen.getByText('More Casual'));

    expect(mockOnRegenerate).toHaveBeenCalledWith({
      preset: mockPresets[0]
    });
  });

  it('should open custom dialog when Custom Prompt is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
        user={mockUser}
      />
    );

    // Open dropdown
    await user.click(screen.getByRole('button'));

    // Click custom prompt option
    await user.click(screen.getByText('Custom Prompt...'));

    // Check if dialog is open
    await waitFor(() => {
      expect(screen.getByText('Custom Regeneration Prompt')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/specific changes/i)).toBeInTheDocument();
    });
  });

  it('should call onRegenerate with custom prompt when submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
        user={mockUser}
      />
    );

    // Open dropdown and click custom prompt
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Custom Prompt...'));

    // Type custom prompt
    const textarea = screen.getByPlaceholderText(/specific changes/i);
    await user.type(textarea, 'Make it more concise and add examples');

    // Submit
    const submitButton = screen.getByRole('button', { name: /regenerate/i });
    await user.click(submitButton);

    expect(mockOnRegenerate).toHaveBeenCalledWith({
      customPrompt: 'Make it more concise and add examples'
    });
  });

  it('should call onRegenerate with user style when available', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'regeneration_presets') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPresets,
              error: null
            })
          })
        } as any;
      }
      if (table === 'user_preferences') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserPreferences,
                error: null
              })
            })
          })
        } as any;
      }
      return {} as any;
    });

    const user = userEvent.setup();
    
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
        user={mockUser}
      />
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_preferences');
    });

    // Open dropdown
    await user.click(screen.getByRole('button'));

    // Click use my writing style
    await user.click(screen.getByText('Use My Writing Style'));

    expect(mockOnRegenerate).toHaveBeenCalledWith({
      useUserStyle: true
    });
  });

  it('should disable user style option when no writing samples', async () => {
    const prefsWithoutSamples = {
      ...mockUserPreferences,
      writing_samples: []
    };

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'regeneration_presets') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPresets,
              error: null
            })
          })
        } as any;
      }
      if (table === 'user_preferences') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: prefsWithoutSamples,
                error: null
              })
            })
          })
        } as any;
      }
      return {} as any;
    });

    const user = userEvent.setup();
    
    render(
      <RegenerationDropdown 
        onRegenerate={mockOnRegenerate}
        isRegenerating={false}
        user={mockUser}
      />
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_preferences');
    });

    // Open dropdown
    await user.click(screen.getByRole('button'));

    // Check that the option shows settings link
    expect(screen.getByText(/Add writing samples/i)).toBeInTheDocument();
  });
});
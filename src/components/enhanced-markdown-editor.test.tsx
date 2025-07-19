import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedMarkdownEditor from './enhanced-markdown-editor';
import { uploadImage } from '../lib/image-upload';
import { useToast } from '../../hooks/use-toast';

// Mock dependencies
vi.mock('../lib/image-upload');
vi.mock('../../hooks/use-toast');

describe('EnhancedMarkdownEditor', () => {
  const mockOnChange = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);
  });

  describe('Markdown Shortcuts', () => {
    it('should make text bold with cmd+b', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedMarkdownEditor
          initialContent="hello world"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Select "world"
      textarea.setSelectionRange(6, 11);
      
      // Press Cmd+B
      await user.keyboard('{Meta>}b{/Meta}');
      
      expect(mockOnChange).toHaveBeenCalledWith('hello **world**');
    });

    it('should make text italic with cmd+i', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedMarkdownEditor
          initialContent="hello world"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Select "hello"
      textarea.setSelectionRange(0, 5);
      
      // Press Cmd+I
      await user.keyboard('{Meta>}i{/Meta}');
      
      expect(mockOnChange).toHaveBeenCalledWith('*hello* world');
    });

    it('should insert link syntax with cmd+k when text is selected', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedMarkdownEditor
          initialContent="Check out GitHub"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Select "GitHub"
      textarea.setSelectionRange(10, 16);
      
      // Press Cmd+K
      await user.keyboard('{Meta>}k{/Meta}');
      
      expect(mockOnChange).toHaveBeenCalledWith('Check out [GitHub](url)');
    });

    it('should insert empty link syntax with cmd+k when no text is selected', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedMarkdownEditor
          initialContent="Hello "
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Position cursor at end
      textarea.setSelectionRange(6, 6);
      
      // Press Cmd+K
      await user.keyboard('{Meta>}k{/Meta}');
      
      expect(mockOnChange).toHaveBeenCalledWith('Hello [](url)');
    });

    it('should make text inline code with alt+backtick', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedMarkdownEditor
          initialContent="Use the console.log function"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Select "console.log"
      textarea.setSelectionRange(8, 19);
      
      // Press Alt+`
      await user.keyboard('{Alt>}`{/Alt}');
      
      expect(mockOnChange).toHaveBeenCalledWith('Use the `console.log` function');
    });
  });

  describe('Image Upload', () => {
    it('should handle image drag and drop', async () => {
      vi.mocked(uploadImage).mockResolvedValue('https://example.com/image.jpg');
      
      render(
        <EnhancedMarkdownEditor
          initialContent=""
          onChange={mockOnChange}
          user={{ id: 'user-123' }}
        />
      );

      const dropZone = screen.getByRole('textbox').parentElement!;
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      
      // Simulate drag over
      fireEvent.dragOver(dropZone, {
        dataTransfer: {
          types: ['Files'],
          files: [file]
        }
      });
      
      // Should show drag indicator
      expect(dropZone).toHaveClass('bg-blue-50');
      
      // Simulate drop
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(uploadImage).toHaveBeenCalledWith(file);
        expect(mockOnChange).toHaveBeenCalledWith('![test.jpg](https://example.com/image.jpg)');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Image uploaded',
          description: 'Image has been uploaded and inserted into your content'
        });
      });
    });

    it('should reject non-image files', async () => {
      render(
        <EnhancedMarkdownEditor
          initialContent=""
          onChange={mockOnChange}
        />
      );

      const dropZone = screen.getByRole('textbox').parentElement!;
      const file = new File(['document'], 'test.pdf', { type: 'application/pdf' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(uploadImage).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'No images found',
          description: 'Please drop image files only',
          variant: 'destructive'
        });
      });
    });

    it('should handle paste image from clipboard', async () => {
      vi.mocked(uploadImage).mockResolvedValue('https://example.com/pasted.jpg');
      
      render(
        <EnhancedMarkdownEditor
          initialContent=""
          onChange={mockOnChange}
          user={{ id: 'user-123' }}
        />
      );

      const textarea = screen.getByRole('textbox');
      const file = new File(['image'], 'image.png', { type: 'image/png' });
      
      fireEvent.paste(textarea, {
        clipboardData: {
          items: [{
            type: 'image/png',
            getAsFile: () => file
          }]
        }
      });
      
      await waitFor(() => {
        expect(uploadImage).toHaveBeenCalledWith(file);
        expect(mockOnChange).toHaveBeenCalledWith('![image.png](https://example.com/pasted.jpg)');
      });
    });

    it('should show error when upload fails', async () => {
      vi.mocked(uploadImage).mockRejectedValue(new Error('Upload failed'));
      
      render(
        <EnhancedMarkdownEditor
          initialContent=""
          onChange={mockOnChange}
          user={{ id: 'user-123' }}
        />
      );

      const dropZone = screen.getByRole('textbox').parentElement!;
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload failed',
          description: 'Upload failed',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Save Status Indicator', () => {
    it('should show saving status', () => {
      render(
        <EnhancedMarkdownEditor
          initialContent=""
          saveStatus="saving"
        />
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show saved status', () => {
      render(
        <EnhancedMarkdownEditor
          initialContent=""
          saveStatus="saved"
        />
      );
      
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should show error status', () => {
      render(
        <EnhancedMarkdownEditor
          initialContent=""
          saveStatus="error"
        />
      );
      
      expect(screen.getByText('Error saving')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Dialog', () => {
    it('should open shortcuts dialog when clicking help link', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedMarkdownEditor
          initialContent=""
        />
      );
      
      const shortcutsLink = screen.getByText('Keyboard shortcuts');
      await user.click(shortcutsLink);
      
      // Check dialog content
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Cmd+B')).toBeInTheDocument();
      expect(screen.getByText('Bold text')).toBeInTheDocument();
      expect(screen.getByText('Cmd+I')).toBeInTheDocument();
      expect(screen.getByText('Italic text')).toBeInTheDocument();
      expect(screen.getByText('Cmd+K')).toBeInTheDocument();
      expect(screen.getByText('Insert link')).toBeInTheDocument();
      expect(screen.getByText('Alt+`')).toBeInTheDocument();
      expect(screen.getByText('Inline code')).toBeInTheDocument();
      expect(screen.getByText('Cmd+J')).toBeInTheDocument();
      expect(screen.getByText('Open AI editor')).toBeInTheDocument();
    });
  });

  describe('Content Changes', () => {
    it('should call onChange when content is typed', async () => {
      const user = userEvent.setup();
      render(
        <EnhancedMarkdownEditor
          initialContent="Hello"
          onChange={mockOnChange}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, ' World');
      
      expect(mockOnChange).toHaveBeenLastCalledWith('Hello World');
    });
  });
});
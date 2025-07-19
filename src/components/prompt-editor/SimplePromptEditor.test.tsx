import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplePromptEditor } from './SimplePromptEditor';

// Mock the PromptEditorSidebar
vi.mock('./PromptEditorSidebar', () => ({
  PromptEditorSidebar: ({ isOpen, onClose, onApply, selectedText }: any) => 
    isOpen ? (
      <div data-testid="prompt-sidebar">
        <div>Selected: {selectedText}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onApply('replaced text')}>Apply</button>
      </div>
    ) : null
}));

describe('SimplePromptEditor', () => {
  const mockOnTextReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cmd+J Keyboard Shortcut', () => {
    it('should open prompt editor with cmd+j when text is selected', async () => {
      render(
        <SimplePromptEditor onTextReplace={mockOnTextReplace}>
          <textarea defaultValue="Hello world" />
        </SimplePromptEditor>
      );

      const container = screen.getByText(/Hello world/).closest('.prompt-editor-container');
      
      // Mock selection
      const mockSelection = {
        toString: () => 'world',
        removeAllRanges: vi.fn()
      };
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);
      
      // Simulate Cmd+J
      fireEvent.keyDown(container!, {
        key: 'j',
        metaKey: true
      });
      
      // Should open sidebar with selected text
      await waitFor(() => {
        expect(screen.getByTestId('prompt-sidebar')).toBeInTheDocument();
        expect(screen.getByText('Selected: world')).toBeInTheDocument();
      });
    });

    it('should select all text and open editor when cmd+j pressed with no selection', async () => {
      render(
        <SimplePromptEditor onTextReplace={mockOnTextReplace}>
          <textarea defaultValue="Hello world" />
        </SimplePromptEditor>
      );

      const container = screen.getByText(/Hello world/).closest('.prompt-editor-container');
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Focus textarea with no selection
      textarea.focus();
      textarea.setSelectionRange(0, 0);
      
      // Mock empty selection that will trigger select all
      const mockSelection = {
        toString: () => '',
        removeAllRanges: vi.fn()
      };
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);
      
      // Press Cmd+J
      fireEvent.keyDown(container!, {
        key: 'j',
        metaKey: true
      });
      
      // Should select all text and open sidebar
      await waitFor(() => {
        expect(screen.getByTestId('prompt-sidebar')).toBeInTheDocument();
        expect(screen.getByText('Selected: Hello world')).toBeInTheDocument();
      });
    });

    it('should work with ctrl+j on Windows/Linux', async () => {
      
      render(
        <SimplePromptEditor onTextReplace={mockOnTextReplace}>
          <textarea defaultValue="Test content" />
        </SimplePromptEditor>
      );

      const container = screen.getByText(/Test content/).closest('.prompt-editor-container');
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Simulate text selection
      textarea.focus();
      textarea.setSelectionRange(0, 4); // Select "Test"
      
      // Mock getSelection to return our selected text
      const mockSelection = {
        toString: () => 'Test',
        removeAllRanges: vi.fn()
      };
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);
      
      // Simulate Ctrl+J on the container
      fireEvent.keyDown(container!, {
        key: 'j',
        ctrlKey: true
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('prompt-sidebar')).toBeInTheDocument();
        expect(screen.getByText('Selected: Test')).toBeInTheDocument();
      });
    });

    it('should not open on other key combinations', async () => {
      const user = userEvent.setup();
      
      render(
        <SimplePromptEditor onTextReplace={mockOnTextReplace}>
          <textarea defaultValue="Hello world" />
        </SimplePromptEditor>
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      textarea.setSelectionRange(0, 5);
      fireEvent.select(textarea);
      
      // Try other keys
      await user.keyboard('{Meta>}k{/Meta}');
      await user.keyboard('j');
      await user.keyboard('{Alt>}j{/Alt}');
      
      expect(screen.queryByTestId('prompt-sidebar')).not.toBeInTheDocument();
    });
  });

  describe('Escape Key', () => {
    it('should close prompt editor when escape is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <SimplePromptEditor onTextReplace={mockOnTextReplace}>
          <textarea defaultValue="Hello world" />
        </SimplePromptEditor>
      );

      const container = screen.getByText(/Hello world/).closest('.prompt-editor-container');
      
      // Mock getSelection
      const mockSelection = {
        toString: () => 'Hello',
        removeAllRanges: vi.fn()
      };
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);
      
      // Open editor with Meta+J
      fireEvent.keyDown(container!, {
        key: 'j',
        metaKey: true
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('prompt-sidebar')).toBeInTheDocument();
      });
      
      // Find close button and click it
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('prompt-sidebar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Text Replacement', () => {
    it('should replace selected text when apply is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SimplePromptEditor onTextReplace={mockOnTextReplace}>
          <textarea defaultValue="Hello world" />
        </SimplePromptEditor>
      );

      const container = screen.getByText(/Hello world/).closest('.prompt-editor-container');
      
      // Mock selection
      const mockSelection = {
        toString: () => 'world',
        removeAllRanges: vi.fn()
      };
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);
      
      // Open editor
      fireEvent.keyDown(container!, {
        key: 'j',
        metaKey: true
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('prompt-sidebar')).toBeInTheDocument();
      });
      
      // Click apply
      await user.click(screen.getByText('Apply'));
      
      // Should call text replace and close
      expect(mockOnTextReplace).toHaveBeenCalledWith('world', 'replaced text');
      expect(screen.queryByTestId('prompt-sidebar')).not.toBeInTheDocument();
    });
  });

  describe('Sidebar State Management', () => {
    it('should clear selection when closing', async () => {
      const user = userEvent.setup();
      
      render(
        <SimplePromptEditor onTextReplace={mockOnTextReplace}>
          <textarea defaultValue="Hello world" />
        </SimplePromptEditor>
      );

      const container = screen.getByText(/Hello world/).closest('.prompt-editor-container');
      
      // Mock getSelection
      const mockRemoveAllRanges = vi.fn();
      const mockSelection = {
        toString: () => 'Hello',
        removeAllRanges: mockRemoveAllRanges
      };
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);
      
      // Open editor
      fireEvent.keyDown(container!, {
        key: 'j',
        metaKey: true
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('prompt-sidebar')).toBeInTheDocument();
      });
      
      // Click close
      await user.click(screen.getByText('Close'));
      
      // Should close sidebar
      expect(screen.queryByTestId('prompt-sidebar')).not.toBeInTheDocument();
      
      // Selection should be cleared
      expect(mockRemoveAllRanges).toHaveBeenCalled();
    });
  });
});
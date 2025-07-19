import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PromptEditorSidebar } from './PromptEditorSidebar';

interface SimplePromptEditorProps {
  children: React.ReactNode;
  onTextReplace?: (originalText: string, newText: string) => void;
}

export function SimplePromptEditor({ children, onTextReplace }: SimplePromptEditorProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isAllTextSelected, setIsAllTextSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+J (Mac) or Ctrl+J (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        if (text && text.length > 0) {
          // Check if all text is selected
          const textarea = containerRef.current?.querySelector('textarea');
          const isAll = textarea && textarea.value.trim() === text;
          
          setSelectedText(text);
          setIsAllTextSelected(isAll || false);
          setShowSidebar(true);
        } else {
          // If no text is selected, select all text and open the editor
          const textarea = containerRef.current?.querySelector('textarea') as HTMLTextAreaElement;
          if (textarea) {
            textarea.select();
            setSelectedText(textarea.value.trim());
            setIsAllTextSelected(true);
            setShowSidebar(true);
          }
        }
      }
    };

    // Add event listener to the container
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  const handleClose = () => {
    setShowSidebar(false);
    // Clear selection
    window.getSelection()?.removeAllRanges();
  };

  const handleApply = (newText: string) => {
    if (onTextReplace) {
      onTextReplace(selectedText, newText);
    }
    handleClose();
  };

  return (
    <>
      <div ref={containerRef} className="prompt-editor-container">
        {children}
      </div>
      
      {createPortal(
        <PromptEditorSidebar
          selectedText={selectedText}
          isOpen={showSidebar}
          onClose={handleClose}
          onApply={handleApply}
          isAllTextSelected={isAllTextSelected}
        />,
        document.body
      )}
    </>
  );
}
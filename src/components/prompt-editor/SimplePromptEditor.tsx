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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to let selection settle
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        console.log('Mouse up - checking selection:', text);
        
        if (text && text.length > 0) {
          console.log('Selection found:', text);
          setSelectedText(text);
          setShowSidebar(true);
        }
      }, 100);
    };

    // Add event listener to the container
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleMouseUp);
      console.log('Event listener added to container');
    }

    return () => {
      if (container) {
        container.removeEventListener('mouseup', handleMouseUp);
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
        />,
        document.body
      )}
    </>
  );
}
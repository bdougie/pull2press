import { useRef, useState, useEffect } from 'react';
import { useTextSelection } from '../../hooks/useTextSelection';
import { PromptEditorPopup } from './PromptEditorPopup';
import { createPortal } from 'react-dom';

interface PromptEditorProps {
  children: React.ReactNode;
  onTextReplace?: (originalText: string, newText: string) => void;
}

export function PromptEditor({ children, onTextReplace }: PromptEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selection, clearSelection } = useTextSelection(containerRef);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    if (selection.text && selection.rect && !selection.isCollapsed) {
      // Calculate popup position based on selection
      const rect = selection.rect;
      setPopupPosition({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX + (rect.width / 2) - 200, // Center the popup
      });
      setSelectedText(selection.text);
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [selection]);

  const handleClose = () => {
    setShowPopup(false);
    clearSelection();
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
      
      {showPopup && createPortal(
        <PromptEditorPopup
          selectedText={selectedText}
          position={popupPosition}
          onClose={handleClose}
          onApply={handleApply}
        />,
        document.body
      )}
    </>
  );
}
import { useState, useEffect } from 'react';
import { useTextSelection } from '../../hooks/useTextSelection';
import { PromptEditorPopup } from './PromptEditorPopup';
import { createPortal } from 'react-dom';

interface PromptEditorProps {
  children: React.ReactNode;
  onTextReplace?: (originalText: string, newText: string) => void;
}

export function PromptEditor({ children, onTextReplace }: PromptEditorProps) {
  const { selection, clearSelection } = useTextSelection();
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    console.log('Selection updated:', selection);
    if (selection.text && selection.rect && !selection.isCollapsed) {
      // Calculate popup position based on selection
      const rect = selection.rect;
      // Since we're using fixed positioning, we don't need to add scroll offsets
      const position = {
        top: rect.bottom + 10,
        left: Math.max(10, rect.left + (rect.width / 2) - 200), // Center the popup, ensure it's not off-screen
      };
      console.log('Showing popup at position:', position);
      setPopupPosition(position);
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
      <div className="prompt-editor-container">
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
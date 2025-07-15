import { useState, useEffect, useCallback } from 'react';

interface SelectionInfo {
  text: string;
  rect: DOMRect | null;
  isCollapsed: boolean;
}

export function useTextSelection(containerRef?: React.RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<SelectionInfo>({
    text: '',
    rect: null,
    isCollapsed: true,
  });

  const updateSelection = useCallback(() => {
    const sel = window.getSelection();
    console.log('Selection object:', sel);
    
    if (!sel || sel.rangeCount === 0) {
      console.log('No selection or no ranges');
      setSelection({ text: '', rect: null, isCollapsed: true });
      return;
    }

    const text = sel.toString();
    console.log('Selected text:', text, 'Collapsed:', sel.isCollapsed);
    
    if (!text || sel.isCollapsed) {
      setSelection({ text: '', rect: null, isCollapsed: true });
      return;
    }

    try {
      // Get the bounding rectangle of the selection
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      console.log('Text selected:', text.trim(), 'Rect:', rect);

      setSelection({
        text: text.trim(),
        rect,
        isCollapsed: false,
      });
    } catch (error) {
      console.error('Error getting selection range:', error);
      setSelection({ text: '', rect: null, isCollapsed: true });
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const delayedUpdateSelection = () => {
      // Add a small delay to ensure selection is complete
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Delayed update triggered');
        updateSelection();
      }, 200);
    };
    
    // Listen for selection changes
    document.addEventListener('selectionchange', delayedUpdateSelection);
    
    // Also listen for mouseup to catch selections
    document.addEventListener('mouseup', delayedUpdateSelection);
    
    // Listen for keyboard events that might change selection
    document.addEventListener('keyup', delayedUpdateSelection);
    
    // Check initial selection
    updateSelection();

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('selectionchange', delayedUpdateSelection);
      document.removeEventListener('mouseup', delayedUpdateSelection);
      document.removeEventListener('keyup', delayedUpdateSelection);
    };
  }, [updateSelection]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection({ text: '', rect: null, isCollapsed: true });
  }, []);

  return { selection, clearSelection };
}
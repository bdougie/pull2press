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
    if (!sel || sel.isCollapsed) {
      setSelection({ text: '', rect: null, isCollapsed: true });
      return;
    }

    const text = sel.toString().trim();
    if (!text) {
      setSelection({ text: '', rect: null, isCollapsed: true });
      return;
    }

    // Check if selection is within our container (if provided)
    if (containerRef?.current) {
      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container.contains(range.commonAncestorContainer)) {
        setSelection({ text: '', rect: null, isCollapsed: true });
        return;
      }
    }

    // Get the bounding rectangle of the selection
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    console.log('Text selected:', text, 'Rect:', rect);

    setSelection({
      text,
      rect,
      isCollapsed: false,
    });
  }, [containerRef]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const delayedUpdateSelection = () => {
      // Add a small delay to ensure selection is complete
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSelection, 100);
    };
    
    // Listen for selection changes
    document.addEventListener('selectionchange', delayedUpdateSelection);
    
    // Also listen for mouseup to catch selections
    document.addEventListener('mouseup', delayedUpdateSelection);
    
    // Listen for keyboard events that might change selection
    document.addEventListener('keyup', delayedUpdateSelection);

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
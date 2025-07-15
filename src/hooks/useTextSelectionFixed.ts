import { useState, useEffect, useCallback, useRef } from 'react';

interface SelectionInfo {
  text: string;
  rect: DOMRect | null;
  isCollapsed: boolean;
}

export function useTextSelectionFixed() {
  const [selection, setSelection] = useState<SelectionInfo>({
    text: '',
    rect: null,
    isCollapsed: true,
  });
  const lastSelectionRef = useRef<string>('');

  const updateSelection = useCallback(() => {
    const sel = window.getSelection();
    
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      if (lastSelectionRef.current) {
        lastSelectionRef.current = '';
        setSelection({ text: '', rect: null, isCollapsed: true });
      }
      return;
    }

    const text = sel.toString().trim();
    
    // Only update if selection actually changed
    if (!text || text === lastSelectionRef.current) {
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      
      // Create a temporary span to get accurate position
      const span = document.createElement('span');
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      
      // Clone the range and collapse to end
      const endRange = range.cloneRange();
      endRange.collapse(false);
      
      // Insert the span at the end of selection
      endRange.insertNode(span);
      const rect = span.getBoundingClientRect();
      
      // Clean up
      span.remove();
      
      // If we got a valid rect, use it
      if (rect.width > 0 || rect.height > 0) {
        lastSelectionRef.current = text;
        setSelection({
          text,
          rect,
          isCollapsed: false,
        });
      } else {
        // Fallback to range rect
        const rangeRect = range.getBoundingClientRect();
        if (rangeRect.width > 0 || rangeRect.height > 0) {
          lastSelectionRef.current = text;
          setSelection({
            text,
            rect: rangeRect,
            isCollapsed: false,
          });
        }
      }
    } catch (error) {
      console.error('Error getting selection position:', error);
    }
  }, []);

  useEffect(() => {
    // Delay to ensure selection is complete
    const handleSelectionChange = () => {
      setTimeout(updateSelection, 50);
    };

    // Listen to multiple events for better coverage
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateSelection]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    lastSelectionRef.current = '';
    setSelection({ text: '', rect: null, isCollapsed: true });
  }, []);

  return { selection, clearSelection };
}
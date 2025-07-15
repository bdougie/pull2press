import { useEffect, useState } from 'react';

export default function SelectionTest() {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      console.log('Selection event fired');
      
      if (selection && selection.toString()) {
        const text = selection.toString();
        
        // For textarea selections, we need to use a different approach
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') {
          // For input elements, we can't get accurate positioning
          console.log('Selected in input/textarea:', text);
          setSelectedText(text);
          setPosition({ x: 0, y: 0 });
        } else {
          // For regular text, use the range
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          console.log('Selected:', text);
          console.log('Rectangle:', rect);
          
          setSelectedText(text);
          setPosition({ x: rect.left, y: rect.bottom });
        }
      } else {
        setSelectedText('');
      }
    };

    // Try multiple event types
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('selectionchange', handleSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Text Selection Test</h1>
      
      <div className="mb-4 p-4 border">
        <p>Selected text: <strong>{selectedText || 'None'}</strong></p>
        <p>Position: x={position.x}, y={position.y}</p>
      </div>
      
      <div className="space-y-4">
        <p>Select any text in this paragraph to test the selection detection. This is a simple test to verify that text selection events are being captured properly.</p>
        
        <textarea
          className="w-full h-40 p-4 border"
          defaultValue="You can also select text in this textarea. The selection should be detected and displayed above."
        />
        
        <div contentEditable className="p-4 border">
          This is a contentEditable div. Selection should work here too.
        </div>
      </div>
    </div>
  );
}
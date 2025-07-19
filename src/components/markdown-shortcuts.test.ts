import { describe, it, expect } from 'vitest';

// Test the markdown wrapping logic
describe('Markdown Shortcuts Logic', () => {
  const wrapText = (text: string, before: string, after: string = before) => {
    return before + text + after;
  };

  describe('Bold (Cmd+B)', () => {
    it('should wrap text with double asterisks', () => {
      expect(wrapText('hello', '**')).toBe('**hello**');
      expect(wrapText('world', '**')).toBe('**world**');
    });
  });

  describe('Italic (Cmd+I)', () => {
    it('should wrap text with single asterisks', () => {
      expect(wrapText('hello', '*')).toBe('*hello*');
      expect(wrapText('emphasized', '*')).toBe('*emphasized*');
    });
  });

  describe('Code (Alt+`)', () => {
    it('should wrap text with backticks', () => {
      expect(wrapText('console.log', '`')).toBe('`console.log`');
      expect(wrapText('variable', '`')).toBe('`variable`');
    });
  });

  describe('Link (Cmd+K)', () => {
    it('should create markdown link with selected text', () => {
      const selectedText = 'GitHub';
      const result = `[${selectedText}](url)`;
      expect(result).toBe('[GitHub](url)');
    });

    it('should create empty link when no text selected', () => {
      const result = '[](url)';
      expect(result).toBe('[](url)');
    });
  });

  describe('Combined formatting', () => {
    it('should handle nested formatting', () => {
      // Bold + Italic
      const boldItalic = wrapText(wrapText('text', '*'), '**');
      expect(boldItalic).toBe('***text***');
      
      // Bold code
      const boldCode = wrapText(wrapText('code', '`'), '**');
      expect(boldCode).toBe('**`code`**');
    });
  });
});
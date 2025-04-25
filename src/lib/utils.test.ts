import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn function', () => {
  it('should merge class names correctly', () => {
    // Test basic class combination
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    
    expect(cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    )).toBe('base-class active-class');
  });

  it('should properly merge Tailwind classes using tailwind-merge', () => {
    // Test class conflict resolution
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-sm text-gray-500', 'text-blue-500')).toBe('text-sm text-blue-500');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base-class', undefined, null, 'extra-class')).toBe('base-class extra-class');
  });

  it('should handle object notation from clsx', () => {
    expect(cn('base-class', { 'active-class': true, 'disabled-class': false }))
      .toBe('base-class active-class');
  });
});
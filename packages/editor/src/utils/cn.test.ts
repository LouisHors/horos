import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should filter out falsy values', () => {
    const result = cn('class1', null, undefined, false, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle tailwind class conflicts', () => {
    const result = cn('px-2 py-1', 'px-4');
    // tailwind-merge should keep the last conflicting class
    expect(result).toBe('py-1 px-4');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

import { describe, it, expect } from 'vitest';
import { add, multiply } from './index';

describe('Math functions', () => {
  describe('add', () => {
    it('should add two positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-2, 3)).toBe(1);
      expect(add(2, -3)).toBe(-1);
      expect(add(-2, -3)).toBe(-5);
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers correctly', () => {
      expect(multiply(2, 3)).toBe(6);
    });

    it('should handle negative numbers', () => {
      expect(multiply(-2, 3)).toBe(-6);
      expect(multiply(2, -3)).toBe(-6);
      expect(multiply(-2, -3)).toBe(6);
    });
  });
});
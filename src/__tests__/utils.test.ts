import { randomPointInBBox, debounce, randomBetween, isActive } from '../utils';

describe('utils', () => {
  describe('randomPointInBBox', () => {
    it('should return coordinates within bbox', () => {
      const bbox = [-10, -5, 10, 5];
      const [lng, lat] = randomPointInBBox(bbox);
      
      expect(lng).toBeGreaterThanOrEqual(-10);
      expect(lng).toBeLessThanOrEqual(10);
      expect(lat).toBeGreaterThanOrEqual(-5);
      expect(lat).toBeLessThanOrEqual(5);
    });
  });

  describe('randomBetween', () => {
    it('should return number between min and max', () => {
      const result = randomBetween(0.3, 1);
      expect(result).toBeGreaterThanOrEqual(0.3);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should delay function execution', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      expect(fn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      debounced();
      debounced();
      
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isActive', () => {
    it('should return true when no dates provided', () => {
      expect(isActive()).toBe(true);
    });

    it('should return true when current date is within range', () => {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      const startDate = `${month}-${day} 00:00`;
      const endDate = `${month}-${day} 23:59`;
      
      expect(isActive(startDate, endDate)).toBe(true);
    });

    it('should return false when current date is outside range', () => {
      expect(isActive('01-01 00:00', '01-02 00:00')).toBe(false);
    });
  });
});

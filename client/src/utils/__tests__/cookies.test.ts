import { getCookie, setCookie, generateUserIdentifier, getUserIdentifier } from '../cookies';

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: ''
});

// Mock window.navigator and window.screen
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'ko-KR'
  }
});

Object.defineProperty(window, 'screen', {
  writable: true,
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24
  }
});

describe('Cookie utilities', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = '';
  });

  describe('getCookie', () => {
    it('returns null when cookie does not exist', () => {
      expect(getCookie('nonexistent')).toBeNull();
    });

    it('returns cookie value when cookie exists', () => {
      document.cookie = 'test_cookie=test_value';
      expect(getCookie('test_cookie')).toBe('test_value');
    });

    it('returns correct value when multiple cookies exist', () => {
      document.cookie = 'cookie1=value1; cookie2=value2; cookie3=value3';
      expect(getCookie('cookie2')).toBe('value2');
    });
  });

  describe('setCookie', () => {
    it('sets a cookie with default expiration', () => {
      setCookie('test_cookie', 'test_value');
      expect(document.cookie).toContain('test_cookie=test_value');
    });

    it('sets a cookie with custom expiration days', () => {
      setCookie('test_cookie', 'test_value', 30);
      expect(document.cookie).toContain('test_cookie=test_value');
    });
  });

  describe('generateUserIdentifier', () => {
    it('returns existing user_id cookie if it exists', () => {
      const existingId = 'existing_user_123';
      document.cookie = `user_id=${existingId}`;
      
      const result = generateUserIdentifier();
      expect(result).toBe(existingId);
    });

    it('generates a new user identifier when no cookie exists', () => {
      const result = generateUserIdentifier();
      
      expect(result).toMatch(/^user_[a-z0-9]+_[a-z0-9]+$/);
      expect(document.cookie).toContain(`user_id=${result}`);
    });

    it('generates different identifiers on subsequent calls when no cookie exists', () => {
      // Mock Math.random to return different values
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        return callCount * 0.1;
      };

      const id1 = generateUserIdentifier();
      
      // Clear cookie to force generation of new ID
      document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      const id2 = generateUserIdentifier();
      
      expect(id1).not.toBe(id2);
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });

  describe('getUserIdentifier', () => {
    it('returns the same identifier as generateUserIdentifier', () => {
      const generated = generateUserIdentifier();
      const retrieved = getUserIdentifier();
      
      expect(retrieved).toBe(generated);
    });
  });
});
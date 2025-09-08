import bcrypt from 'bcrypt';
import { hashPassword, verifyPassword } from '../auth';

// Mock bcrypt
jest.mock('bcrypt');

describe('Authentication Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const mockHashedPassword = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

      const result = await hashPassword('1234');

      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
      expect(result).toBe(mockHashedPassword);
    });

    it('should handle bcrypt errors', async () => {
      const error = new Error('Hashing failed');
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(hashPassword('1234')).rejects.toThrow('Hashing failed');
    });

    it('should hash different passwords to different values', async () => {
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hash-1234')
        .mockResolvedValueOnce('hash-5678');

      const hash1 = await hashPassword('1234');
      const hash2 = await hashPassword('5678');

      expect(hash1).toBe('hash-1234');
      expect(hash2).toBe('hash-5678');
      expect(bcrypt.hash).toHaveBeenCalledTimes(2);
    });

    it('should handle empty password', async () => {
      const mockHashedPassword = 'hashed-empty';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

      const result = await hashPassword('');

      expect(bcrypt.hash).toHaveBeenCalledWith('', 10);
      expect(result).toBe(mockHashedPassword);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()';
      const mockHashedPassword = 'hashed-special';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

      const result = await hashPassword(specialPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, 10);
      expect(result).toBe(mockHashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyPassword('1234', 'hashed-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hashed-password');
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyPassword('wrong', 'hashed-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hashed-password');
      expect(result).toBe(false);
    });

    it('should handle bcrypt comparison errors', async () => {
      const error = new Error('Comparison failed');
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(verifyPassword('1234', 'hashed-password'))
        .rejects.toThrow('Comparison failed');
    });

    it('should handle empty password verification', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyPassword('', 'hashed-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('', 'hashed-password');
      expect(result).toBe(false);
    });

    it('should handle empty hash verification', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyPassword('1234', '');

      expect(bcrypt.compare).toHaveBeenCalledWith('1234', '');
      expect(result).toBe(false);
    });

    it('should verify multiple passwords correctly', async () => {
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result1 = await verifyPassword('1234', 'hash1');
      const result2 = await verifyPassword('wrong', 'hash2');
      const result3 = await verifyPassword('5678', 'hash3');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });

    it('should handle special characters in password verification', async () => {
      const specialPassword = '!@#$%^&*()';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyPassword(specialPassword, 'hashed-special');

      expect(bcrypt.compare).toHaveBeenCalledWith(specialPassword, 'hashed-special');
      expect(result).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should hash and verify password correctly', async () => {
      const originalPassword = '1234';
      const hashedPassword = 'hashed-1234';

      // Mock hashing
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      // Mock verification
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Hash the password
      const hash = await hashPassword(originalPassword);
      
      // Verify the password
      const isValid = await verifyPassword(originalPassword, hash);

      expect(hash).toBe(hashedPassword);
      expect(isValid).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith(originalPassword, 10);
      expect(bcrypt.compare).toHaveBeenCalledWith(originalPassword, hashedPassword);
    });

    it('should fail verification with wrong password', async () => {
      const originalPassword = '1234';
      const wrongPassword = '5678';
      const hashedPassword = 'hashed-1234';

      // Mock hashing
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      // Mock verification failure
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Hash the original password
      const hash = await hashPassword(originalPassword);
      
      // Try to verify with wrong password
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(hash).toBe(hashedPassword);
      expect(isValid).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, hashedPassword);
    });
  });

  describe('Performance and security', () => {
    it('should use appropriate salt rounds for security', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await hashPassword('1234');

      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
    });

    it('should handle concurrent hashing operations', async () => {
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hash1')
        .mockResolvedValueOnce('hash2')
        .mockResolvedValueOnce('hash3');

      const promises = [
        hashPassword('pass1'),
        hashPassword('pass2'),
        hashPassword('pass3')
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(['hash1', 'hash2', 'hash3']);
      expect(bcrypt.hash).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent verification operations', async () => {
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const promises = [
        verifyPassword('pass1', 'hash1'),
        verifyPassword('wrong', 'hash2'),
        verifyPassword('pass3', 'hash3')
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, false, true]);
      expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });
  });
});
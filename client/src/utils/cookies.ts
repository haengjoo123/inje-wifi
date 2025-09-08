/**
 * Cookie utility functions for user identification
 */

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  
  return null;
}

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Generate a user identifier for empathy tracking
 * This creates a simple identifier based on browser fingerprinting
 */
export function generateUserIdentifier(): string {
  // Try to get existing user_id cookie first
  const existingId = getCookie('user_id');
  if (existingId) {
    return existingId;
  }

  // Generate a new identifier based on browser characteristics
  const navigator = window.navigator;
  const screen = window.screen;
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    // Add a random component to make it unique
    Math.random().toString(36).substring(2, 15)
  ].join('|');

  // Create a simple hash of the fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const userId = `user_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  
  // Set the cookie for future use
  setCookie('user_id', userId);
  
  return userId;
}

/**
 * Get the current user identifier, generating one if it doesn't exist
 */
export function getUserIdentifier(): string {
  return generateUserIdentifier();
}
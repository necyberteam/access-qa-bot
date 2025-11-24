import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Get or create a session ID from localStorage
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return uuidv4();
  }

  let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }

  return sessionId;
}

/**
 * Clear the current session ID
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  }
}

/**
 * Generate a new query ID for each Q&A interaction
 */
export function generateQueryId(): string {
  return uuidv4();
}

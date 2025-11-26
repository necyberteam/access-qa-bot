/**
 * Validation utilities for form inputs in ticket flows
 *
 * These functions return objects compatible with @rcb-plugins/input-validator:
 * { success: boolean, promptContent?: string, promptDuration?: number, promptType?: string }
 */

export interface ValidationResult {
  success: boolean;
  promptContent?: string;
  promptDuration?: number;
  promptType?: string;
}

/**
 * Validates an email address
 * Returns validation result object for InputValidator plugin
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return {
      success: false,
      promptContent: 'Email is required',
      promptDuration: 3000,
      promptType: 'error',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      promptContent: 'Please enter a valid email address',
      promptDuration: 3000,
      promptType: 'error',
    };
  }

  return { success: true };
}

/**
 * Creates a validator for optional fields
 * Always returns success since the field is optional
 */
export function createOptionalFieldValidator(): () => ValidationResult {
  return () => ({ success: true });
}

/**
 * Processes optional input - returns empty string for skipped fields
 */
export function processOptionalInput(input: string): string {
  if (!input || input.trim() === '' || input.trim().toLowerCase() === 'skip') {
    return '';
  }
  return input.trim();
}

/**
 * Validates that a required field is not empty
 * Returns validation result object for InputValidator plugin
 */
export function validateRequired(value: string, fieldName: string = 'This field'): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      success: false,
      promptContent: `${fieldName} is required`,
      promptDuration: 3000,
      promptType: 'error',
    };
  }
  return { success: true };
}

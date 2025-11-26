/**
 * Flow context utilities for managing form state in conversational flows
 * Solves React closure issues by providing global access to current form state
 */

export interface TicketFormData {
  // User info
  email?: string;
  name?: string;
  accessId?: string;

  // Common ticket fields
  summary?: string;
  description?: string;
  priority?: string;
  category?: string;

  // Login-specific fields
  identityProvider?: string;
  browser?: string;

  // Resource fields (affiliated login)
  resource?: string;
  userIdResource?: string;

  // Resource fields (general help)
  involvesResource?: string;
  resourceDetails?: string;
  userIdAtResource?: string;

  // File upload
  uploadedFiles?: File[];
  wantsAttachment?: string;
  uploadConfirmed?: boolean;

  // Keywords
  keywords?: string | string[];
  suggestedKeyword?: string;

  // Submission result
  ticketKey?: string;
  ticketUrl?: string;
  submissionError?: string;

  // Allow additional fields
  [key: string]: unknown;
}

export interface UserInfo {
  email?: string;
  name?: string;
  accessId?: string;
}

export interface FormContext {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
}

// Global form context reference
let currentFormContext: FormContext | null = null;

/**
 * Sets the current form context reference
 * Call this when creating flows to enable access to latest form state
 */
export function setCurrentFormContext(context: FormContext): void {
  currentFormContext = context;
}

/**
 * Clears the current form context
 */
export function clearFormContext(): void {
  currentFormContext = null;
}

/**
 * Gets the current ticket form state
 * Always returns the latest state, avoiding stale closure issues
 */
export function getCurrentTicketForm(): TicketFormData {
  if (!currentFormContext) {
    console.warn('Form context not available, returning empty form');
    return {};
  }
  return currentFormContext.ticketForm || {};
}

/**
 * Updates the ticket form with new values
 */
export function updateTicketForm(updates: Partial<TicketFormData>): void {
  if (!currentFormContext) {
    console.warn('Form context not available, cannot update form');
    return;
  }
  currentFormContext.setTicketForm(prev => ({ ...prev, ...updates }));
}

/**
 * Gets current form merged with user info (user info takes precedence if form is empty)
 */
export function getCurrentFormWithUserInfo(userInfo: UserInfo = {}): TicketFormData {
  const currentForm = getCurrentTicketForm();
  return {
    ...currentForm,
    email: userInfo.email || currentForm.email,
    name: userInfo.name || currentForm.name,
    accessId: userInfo.accessId || currentForm.accessId,
  };
}

/**
 * Gets file info string for summaries
 */
export function getFileInfo(uploadedFiles?: File[]): string {
  if (uploadedFiles && uploadedFiles.length > 0) {
    return `\nAttachments: ${uploadedFiles.length} file(s) attached`;
  }
  return '';
}

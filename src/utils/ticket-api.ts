/**
 * ACCESS-specific ticket submission API utilities
 * Handles JIRA/JSM ticket creation via Netlify proxy
 */

import { filesToBase64 } from '@snf/qa-bot-core';
import type { ProcessedFile } from '@snf/qa-bot-core';
import { API_CONFIG } from '../config/constants';

// JSM Request Type IDs
export const REQUEST_TYPE_IDS = {
  SUPPORT: 17,
  LOGIN_ACCESS: 30,
  LOGIN_PROVIDER: 31,
  SECURITY: 26,
} as const;

export type TicketType = 'support' | 'general_help' | 'loginAccess' | 'loginProvider' | 'security';

export interface TicketSubmissionData {
  serviceDeskId: number;
  requestTypeId: number;
  requestFieldValues: Record<string, unknown>;
  attachments?: ProcessedFile[];
}

export interface TicketSubmissionResult {
  success: boolean;
  ticketKey?: string;
  ticketUrl?: string;
  error?: string;
  status?: number;
}

/**
 * Prepares form data for JSM API submission
 */
export async function prepareApiSubmission(
  formData: Record<string, unknown>,
  ticketType: TicketType = 'support',
  uploadedFiles: File[] = []
): Promise<TicketSubmissionData> {
  const requestTypeIds: Record<TicketType, number> = {
    support: REQUEST_TYPE_IDS.SUPPORT,
    general_help: REQUEST_TYPE_IDS.SUPPORT,
    loginAccess: REQUEST_TYPE_IDS.LOGIN_ACCESS,
    loginProvider: REQUEST_TYPE_IDS.LOGIN_PROVIDER,
    security: REQUEST_TYPE_IDS.SECURITY,
  };

  const requestTypeId = requestTypeIds[ticketType] || REQUEST_TYPE_IDS.SUPPORT;
  const serviceDeskId = ticketType === 'security' ? 3 : 2;

  const submissionData: TicketSubmissionData = {
    serviceDeskId,
    requestTypeId,
    requestFieldValues: { ...formData },
  };

  // Process file attachments if any
  if (uploadedFiles.length > 0) {
    submissionData.attachments = await filesToBase64(uploadedFiles);
  }

  return submissionData;
}

/**
 * Sends prepared ticket data to the Netlify proxy
 */
export async function sendToProxy(
  submissionData: TicketSubmissionData,
  endpoint: 'tickets' | 'security-incidents'
): Promise<TicketSubmissionResult> {
  const baseUrl = API_CONFIG.NETLIFY_BASE_URL;
  const proxyEndpoint = `${baseUrl}/api/v1/${endpoint}`;

  try {
    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText;
        }
      } catch {
        errorMessage = `HTTP ${response.status} ${response.statusText}`;
      }

      // User-friendly messages for common errors
      if (response.status === 403) {
        errorMessage = 'The ticket service is temporarily unavailable. Please try again later or contact support directly.';
      } else if (response.status === 404) {
        errorMessage = 'Ticket service not found. Please try again later.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication error with the ticket service. Please contact support.';
      }

      return {
        success: false,
        status: response.status,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return {
      success: true,
      ticketKey: data.data?.ticketKey,
      ticketUrl: data.data?.ticketUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * High-level function to submit a ticket
 */
export async function submitTicket(
  formData: Record<string, unknown>,
  ticketType: TicketType,
  uploadedFiles: File[] = []
): Promise<TicketSubmissionResult> {
  try {
    const submissionData = await prepareApiSubmission(formData, ticketType, uploadedFiles);
    const endpoint = ticketType === 'security' ? 'security-incidents' : 'tickets';
    return await sendToProxy(submissionData, endpoint);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generates a success/error message for ticket submission
 */
export function generateSuccessMessage(
  result: TicketSubmissionResult | null,
  ticketType: string = 'ticket'
): string {
  if (!result) {
    return `We apologize, but there was an error submitting your ${ticketType}.\n\nPlease try again or contact our support team directly.`;
  }

  if (!result.success) {
    return `We apologize, but there was an error submitting your ${ticketType}: ${result.error || 'Unknown error'}\n\nPlease try again or contact our support team directly.`;
  }

  if (result.ticketUrl && result.ticketKey) {
    return `Your ${ticketType} has been submitted successfully.\n\nTicket: <a href="${result.ticketUrl}" target="_blank">${result.ticketKey}</a>\n\nOur support team will review your request and respond accordingly. Thank you for contacting ACCESS.`;
  }

  return `Your ${ticketType} has been submitted successfully.\n\nOur support team will review your request and respond accordingly. Thank you for contacting ACCESS.`;
}

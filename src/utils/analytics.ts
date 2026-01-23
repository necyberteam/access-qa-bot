/**
 * Analytics utilities for ACCESS QA Bot
 * 
 * This module provides Layer 2 analytics events for ACCESS-specific flows.
 * Core Q&A events come from qa-bot-core; this adds ticket, security, and metrics tracking.
 */

import { createContext, useContext } from 'react';

/**
 * Layer 2 event types for access-qa-bot
 */
export type AccessAnalyticsEventType =
  | 'chatbot_menu_selected'
  | 'chatbot_ticket_started'
  | 'chatbot_ticket_step'
  | 'chatbot_ticket_submitted'
  | 'chatbot_ticket_error'
  | 'chatbot_file_uploaded'
  | 'chatbot_security_started'
  | 'chatbot_security_submitted'
  | 'chatbot_metrics_question_sent'
  | 'chatbot_flow_abandoned';

/**
 * Base analytics event structure
 */
export interface AccessAnalyticsEvent {
  type: AccessAnalyticsEventType;
  sessionId?: string;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Combined event type (core + layer 2)
 * Core events from qa-bot-core pass through unchanged
 */
export type AnalyticsEvent = AccessAnalyticsEvent | {
  type: string;
  sessionId?: string;
  timestamp: number;
  [key: string]: unknown;
};

/**
 * Event input for tracking (timestamp optional, will be added)
 */
export interface TrackEventInput {
  type: string;
  sessionId?: string;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * Analytics tracking function signature
 */
export type TrackEventFn = (event: TrackEventInput) => void;

/**
 * Context for passing analytics tracking to flows
 */
interface AnalyticsContextType {
  trackEvent: TrackEventFn;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export const AnalyticsProvider = AnalyticsContext.Provider;

/**
 * Hook to access analytics tracking in flow components
 */
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return a no-op tracker if not in context (graceful fallback)
    return {
      trackEvent: () => {},
      sessionId: '',
    };
  }
  return context;
}

/**
 * Creates a tracking function that adds timestamp and sessionId
 */
export function createTracker(
  onAnalyticsEvent: ((event: AnalyticsEvent) => void) | undefined,
  sessionId: string
): TrackEventFn {
  return (event: TrackEventInput) => {
    if (onAnalyticsEvent) {
      const fullEvent: AnalyticsEvent = {
        ...event,
        type: event.type,
        timestamp: event.timestamp ?? Date.now(),
        sessionId: event.sessionId ?? sessionId,
      };
      onAnalyticsEvent(fullEvent);
    }
  };
}

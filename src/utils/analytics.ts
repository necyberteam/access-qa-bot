/**
 * Analytics utilities for ACCESS QA Bot
 *
 * This module provides types for Layer 2 analytics events.
 * Core Q&A events come from qa-bot-core; this adds ticket, security, and metrics tracking.
 */

/**
 * Event input for tracking (timestamp/sessionId optional, will be added by AccessQABot)
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

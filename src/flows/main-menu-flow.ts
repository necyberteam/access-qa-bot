/**
 * Main Menu Flow
 *
 * Entry point for the conversation — builds dynamic buttons from the
 * capabilities API response. Falls back to a minimal "Show my options"
 * button if capabilities haven't loaded yet.
 */

import type { TrackEventFn } from '../utils/analytics';
import type { CapabilitiesResponse } from '../types';

interface FlowParams {
  welcome: string;
  isLoggedIn: boolean;
  trackEvent: TrackEventFn;
  /** Pre-fetched capabilities response (null while loading or on error) */
  capabilities: CapabilitiesResponse | null;
}

/**
 * Example queries that serve as buttons. Each is a real query that goes
 * through the full agent pipeline — no shortcircuit, no canned text.
 * Curated to show breadth and teach users how to phrase questions.
 */
const EXAMPLE_QUERIES = [
  'Show my options',
  'Are there any system outages right now?',
  'Find upcoming workshops and training events',
  'Is Python available on Delta?',
  'Show me affinity groups for machine learning',
  'What allocations are available for new researchers?',
  'Create a support ticket',
  'Recent announcements about Expanse',
];

/** Build option labels — example queries as buttons */
function buildOptionLabels(
  _capabilities: CapabilitiesResponse | null,
): string[] {
  return EXAMPLE_QUERIES;
}

/**
 * Creates the main menu conversation flow
 */
export function createMainMenuFlow({
  welcome,
  trackEvent,
  capabilities,
}: FlowParams) {
  const options = buildOptionLabels(capabilities);

  return {
    start: {
      message: welcome,
      renderHtml: ["BOT"],
      options,
      // Typing is enabled from the start — chatDisabled is NOT set here.
      // Users can type a question OR click a button.
      chatDisabled: false,
      path: (chatState: { userInput: string }) => {
        // Track menu selection
        trackEvent({
          type: 'chatbot_menu_selected',
          selection: chatState.userInput,
        });

        // All selections go to qa_loop — the agent handles routing
        // via classification (domain agents for tickets/announcements,
        // RAG+tools for everything else).
        return 'qa_loop';
      },
    },
  };
}

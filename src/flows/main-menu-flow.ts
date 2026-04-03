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

/** Build option labels from capabilities, grouped by category */
function buildOptionLabels(
  capabilities: CapabilitiesResponse | null,
): string[] {
  if (!capabilities || !capabilities.categories) {
    return ['Show my options'];
  }

  const labels: string[] = [];

  for (const category of capabilities.categories) {
    // Skip categories with no capabilities
    if (!category.capabilities || category.capabilities.length === 0) continue;

    // Skip "general" (Ask a question) — typing IS the default action,
    // per spec resolved decision #1.
    if (category.id === 'general') continue;

    // For single-capability categories, use the capability label directly
    // For multi-capability categories, use the category label
    if (category.capabilities.length === 1) {
      const cap = category.capabilities[0];
      labels.push(cap.locked ? `🔒 ${cap.label}` : cap.label);
    } else {
      labels.push(category.label);
    }
  }

  // Always append the discovery button
  labels.push('Show my options');

  return labels;
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

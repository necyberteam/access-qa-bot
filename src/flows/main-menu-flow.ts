/**
 * Main Menu Flow
 *
 * Entry point for the conversation — builds dynamic buttons from the
 * capabilities API response. Falls back to a minimal "Show my options"
 * button if capabilities haven't loaded yet.
 */

import type { TicketFormData } from '../utils/flow-context';
import type { TrackEventFn } from '../utils/analytics';
import type { CapabilitiesResponse, CapabilityItem } from '../types';

interface FlowParams {
  welcome: string;
  setTicketForm: (form: TicketFormData) => void;
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

/** Map a button label to a flow path */
function getPathForSelection(
  selection: string,
  capabilities: CapabilitiesResponse | null,
  isLoggedIn: boolean,
): string {
  // Strip lock prefix for matching
  const cleanSelection = selection.replace(/^🔒\s*/, '');

  // Discovery button — always goes to qa_loop so agent can respond
  if (selection === 'Show my options') {
    return isLoggedIn ? 'qa_loop' : 'qa_loop';
  }

  // Try to match against capability labels
  if (capabilities) {
    for (const category of capabilities.categories) {
      for (const cap of category.capabilities) {
        if (cap.label === cleanSelection) {
          // Locked capabilities for anonymous users — send to qa_loop
          // which will show login gate via qa-bot-core
          if (cap.locked && !isLoggedIn) {
            return 'qa_loop';
          }
          return mapCapabilityToPath(cap, isLoggedIn);
        }
      }
      // Category-level match — send the category label as a message
      if (category.label === cleanSelection) {
        return isLoggedIn ? 'qa_loop' : 'qa_loop';
      }
    }
  }

  // Fallback — send as a question
  return isLoggedIn ? 'qa_loop' : 'qa_loop';
}

/** Map a specific capability to a flow step */
function mapCapabilityToPath(cap: CapabilityItem, isLoggedIn: boolean): string {
  switch (cap.id) {
    case 'open_ticket':
      return 'help_ticket';
    case 'report_security':
      return 'security_incident';
    case 'report_login_problem':
      return 'help_ticket';
    case 'check_usage':
      return 'metrics_intro';
    default:
      // All other capabilities (ask_question, search_*, browse_*, manage_*, etc.)
      // send their label as a message to the agent via qa_loop
      return isLoggedIn ? 'qa_loop' : 'qa_loop';
  }
}

/**
 * Creates the main menu conversation flow
 */
export function createMainMenuFlow({
  welcome,
  setTicketForm,
  isLoggedIn,
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

        const selection = chatState.userInput;

        // Handle locked capabilities for anonymous users
        if (selection.startsWith('🔒 ')) {
          // Send the clean label to qa_loop — the agent will respond
          // and qa-bot-core's login gate handles the rest
          return 'qa_loop';
        }

        // Ticket flows need form reset
        if (selection === 'Open a help ticket' || selection === 'Report a login problem') {
          setTicketForm({});
          return 'help_ticket';
        }
        if (selection === 'Report a security issue') {
          setTicketForm({});
          trackEvent({ type: 'chatbot_security_started' });
          return 'security_incident';
        }

        return getPathForSelection(selection, capabilities, isLoggedIn);
      },
    },
  };
}

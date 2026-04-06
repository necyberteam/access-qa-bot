/**
 * Main Menu Flow
 *
 * Entry point for the conversation — shows a single "Show my options"
 * discovery button. The agent returns a rich list of example queries
 * when clicked.
 */

import type { TrackEventFn } from '../utils/analytics';

interface FlowParams {
  welcome: string;
  isLoggedIn: boolean;
  trackEvent: TrackEventFn;
}

/**
 * Creates the main menu conversation flow
 */
export function createMainMenuFlow({
  welcome,
  trackEvent,
}: FlowParams) {
  return {
    start: {
      message: welcome,
      renderHtml: ["BOT"],
      options: ['Show my options'],
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

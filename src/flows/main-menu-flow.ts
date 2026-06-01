/**
 * Main Menu Flow — agentic mode.
 *
 * Single "Show my options" discovery button. Everything the user types or
 * clicks routes to qa_loop, where the agent handles routing (tickets,
 * announcements, RAG + tools) via its own classification. The agent's
 * /capabilities response surfaces the rich option list.
 *
 * The previous static 4-button menu (Ask / Ticket / Security / Metrics),
 * used while the agent was disabled, is preserved in git history at
 * v3.7.4:src/flows/main-menu-flow.ts.
 */

import type { TicketFormData } from '../utils/flow-context';
import type { TrackEventFn } from '../utils/analytics';

interface FlowParams {
  welcome: string;
  // Accepted for call-site compatibility; the agentic menu doesn't use it
  // (ticket state is reset by the agent-driven flows, not the menu).
  setTicketForm?: (form: TicketFormData) => void;
  trackEvent: TrackEventFn;
}

/**
 * Creates the main menu conversation flow.
 *
 * Login gating for the Q&A path happens downstream in qa-bot-core's qa_loop
 * step (via isLoggedIn + allowAnonAccess passed to QABot), so we don't need
 * isLoggedIn here.
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
      // Typing is enabled from the start — users can type a question OR
      // click the button. chatDisabled is explicitly false.
      chatDisabled: false,
      path: (chatState: { userInput: string }) => {
        trackEvent({ type: 'chatbot_menu_selected', selection: chatState.userInput });
        // All selections go to qa_loop — the agent handles routing.
        return 'qa_loop';
      },
    },
  };
}

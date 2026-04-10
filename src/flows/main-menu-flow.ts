/**
 * Main Menu Flow — static buttons for non-agentic mode.
 *
 * The previous dynamic capabilities-driven version (single "Show my options"
 * button that called the agent's /capabilities endpoint) is preserved in git
 * history at v3.5.0:src/flows/main-menu-flow.ts. Restore it when re-enabling
 * the agent.
 */

import type { TicketFormData } from '../utils/flow-context';
import type { TrackEventFn } from '../utils/analytics';

interface FlowParams {
  welcome: string;
  setTicketForm: (form: TicketFormData) => void;
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
  setTicketForm,
  trackEvent,
}: FlowParams) {
  return {
    start: {
      message: welcome,
      renderHtml: ["BOT"],
      options: [
        'Ask a question',
        'Open a help ticket',
        'Report a security issue',
        'Ask about metrics',
      ],
      chatDisabled: false,
      path: (chatState: { userInput: string }) => {
        const selection = chatState.userInput;
        trackEvent({ type: 'chatbot_menu_selected', selection });

        switch (selection) {
          case 'Open a help ticket':
            // Reset any prior form state so the ticket flow starts clean.
            setTicketForm({});
            return 'help_ticket';
          case 'Report a security issue':
            setTicketForm({});
            trackEvent({ type: 'chatbot_security_started' });
            return 'security_incident';
          case 'Ask about metrics':
            return 'metrics_intro';
          default:
            // 'Ask a question' (or any free-text input) → Q&A loop
            return 'qa_loop';
        }
      },
    },
  };
}

/**
 * Main Menu Flow
 *
 * Entry point for the conversation - provides top-level navigation options.
 */

import type { TicketFormData } from '../utils/flow-context';
import type { TrackEventFn } from '../utils/analytics';

interface FlowParams {
  welcome: string;
  setTicketForm: (form: TicketFormData) => void;
  isLoggedIn: boolean;
  trackEvent: TrackEventFn;
}

interface ChatState {
  userInput: string;
}

/**
 * Creates the main menu conversation flow
 */
export function createMainMenuFlow({ welcome, setTicketForm, isLoggedIn, trackEvent }: FlowParams) {
  return {
    start: {
      message: welcome,
      options: [
        "Ask a question about ACCESS",
        "Open a Help Ticket",
        "Usage and performance of ACCESS resources (XDMoD)",
        "Report a security issue",
      ],
      path: (chatState: ChatState) => {
        // Track menu selection
        trackEvent({
          type: 'chatbot_menu_selected',
          selection: chatState.userInput,
        });

        if (chatState.userInput === "Ask a question about ACCESS") {
          // If logged in, show prompt step that waits for actual question
          // If logged out, go directly to qa_loop which shows login gate
          return isLoggedIn ? "go_ahead_and_ask" : "qa_loop";
        } else if (chatState.userInput === "Open a Help Ticket") {
          // Reset form data when starting a new ticket
          setTicketForm({});
          return "help_ticket";
        } else if (chatState.userInput === "Usage and performance of ACCESS resources (XDMoD)") {
          return "metrics_intro";
        } else if (chatState.userInput === "Report a security issue") {
          // Reset form data when starting a security report
          setTicketForm({});
          trackEvent({
            type: 'chatbot_security_started',
          });
          return "security_incident";
        }
        return "start";
      },
    },

    // Transition step for logged-in users - absorbs button click, waits for real question
    go_ahead_and_ask: {
      message: "Go ahead and ask your question! I'll do my best to help.",
      path: "qa_loop",
    },
  };
}

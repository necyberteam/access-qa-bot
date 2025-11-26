/**
 * Main Menu Flow
 *
 * Entry point for the conversation - provides top-level navigation options.
 */

import type { TicketFormData } from '../utils/flow-context';

interface FlowParams {
  welcome: string;
  setTicketForm: (form: TicketFormData) => void;
}

interface ChatState {
  userInput: string;
}

/**
 * Creates the main menu conversation flow
 */
export function createMainMenuFlow({ welcome, setTicketForm }: FlowParams) {
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
        if (chatState.userInput === "Ask a question about ACCESS") {
          return "go_ahead_and_ask";
        } else if (chatState.userInput === "Open a Help Ticket") {
          // Reset form data when starting a new ticket
          setTicketForm({});
          return "help_ticket";
        } else if (chatState.userInput === "Usage and performance of ACCESS resources (XDMoD)") {
          return "metrics_intro";
        } else if (chatState.userInput === "Report a security issue") {
          // Reset form data when starting a security report
          setTicketForm({});
          return "security_incident";
        }
        return "start";
      },
    },

    // Transition to qa-bot-core's built-in Q&A flow
    go_ahead_and_ask: {
      message: "Go ahead and ask your question! I'll do my best to help.",
      path: "qa_loop",
    },
  };
}

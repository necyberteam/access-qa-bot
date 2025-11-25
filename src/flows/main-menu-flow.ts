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

interface FlowStep {
  message: string;
  options: string[];
  chatDisabled: boolean;
  path: string | ((chatState: ChatState) => string);
}

type Flow = Record<string, FlowStep>;

/**
 * Creates the main menu conversation flow
 */
export function createMainMenuFlow({ welcome, setTicketForm }: FlowParams): Flow {
  return {
    start: {
      message: welcome,
      options: [
        "Ask a question about ACCESS",
        "Open a Help Ticket",
        // Future options:
        // "Usage and performance of ACCESS resources (XDMoD)",
        // "Report a security issue",
      ],
      chatDisabled: true,
      path: (chatState: ChatState) => {
        if (chatState.userInput === "Ask a question about ACCESS") {
          return "go_ahead_and_ask";
        } else if (chatState.userInput === "Open a Help Ticket") {
          // Reset form data when starting a new ticket
          setTicketForm({});
          return "help_ticket";
        }
        return "start";
      },
    },

    // Transition to qa-bot-core's built-in Q&A flow
    go_ahead_and_ask: {
      message: "Go ahead and ask your question! I'll do my best to help.",
      options: [],
      chatDisabled: false, // Allow text input for Q&A
      // Route to qa-bot-core's qa_loop which handles actual Q&A
      path: "qa_loop",
    },
  };
}

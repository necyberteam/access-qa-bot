/**
 * Main Menu Flow
 *
 * Entry point for the conversation - provides top-level navigation options.
 */

import type { TicketFormData } from '../utils/flow-context';
import { resolveFlow, type FlowInput, type ChatState } from '../utils/flow-helpers';

interface FlowParams {
  welcome: string;
  setTicketForm: (form: TicketFormData) => void;
}

/**
 * Creates the main menu conversation flow
 *
 * Note: chatDisabled is auto-detected based on options:
 * - Steps with options → buttons only (no text input)
 * - Steps without options → text input enabled
 */
export function createMainMenuFlow({ welcome, setTicketForm }: FlowParams) {
  const flow: FlowInput = {
    start: {
      message: welcome,
      options: [
        "Ask a question about ACCESS",
        "Open a Help Ticket",
        // Future options:
        // "Usage and performance of ACCESS resources (XDMoD)",
        // "Report a security issue",
      ],
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
      // No options = text input enabled automatically
      path: "qa_loop",
    },
  };

  return resolveFlow(flow);
}

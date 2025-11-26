/**
 * Ticket Flow Combiner
 *
 * Combines the ticket type selection with individual ticket flows.
 * This demonstrates the modular flow architecture.
 */

import { createAccessLoginFlow } from './access-login-flow';
import { createResourceLoginFlow } from './resource-login-flow';
import type { TicketFormData, UserInfo } from '../utils/flow-context';

interface FlowParams {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
  userInfo: UserInfo;
}

interface ChatState {
  userInput: string;
}

/**
 * Creates the combined ticket flow with type selection and all ticket types
 */
export function createTicketFlow({ ticketForm, setTicketForm, userInfo }: FlowParams) {
  // Create individual ticket flows
  const accessLoginFlow = createAccessLoginFlow({ ticketForm, setTicketForm, userInfo });
  const resourceLoginFlow = createResourceLoginFlow({ ticketForm, setTicketForm, userInfo });

  // Future: Add more ticket flows here
  // const generalHelpFlow = createGeneralHelpFlow({ ticketForm, setTicketForm, userInfo });

  return {
    // Ticket type selection
    help_ticket: {
      message: "What is your help ticket related to?",
      options: [
        "Logging into ACCESS website",
        "Logging into a resource",
        "Another question",
      ],
      chatDisabled: true, // Options only
      function: (chatState: ChatState) => {
        setTicketForm(prev => ({ ...prev, ticketType: chatState.userInput }));
      },
      path: (chatState: ChatState) => {
        if (chatState.userInput === "Logging into ACCESS website") {
          return "access_help";
        } else if (chatState.userInput === "Logging into a resource") {
          return "resource_help";
        } else if (chatState.userInput === "Another question") {
          // TODO: Implement general help flow
          return "help_ticket"; // For now, stay on selection
        }
        return "help_ticket";
      },
    },

    // Combine all ticket flows
    ...accessLoginFlow,
    ...resourceLoginFlow,
    // Future: ...generalHelpFlow,
  };
}

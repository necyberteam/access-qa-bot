/**
 * Ticket Flow Combiner
 *
 * Combines the ticket type selection with individual ticket flows.
 * This demonstrates the modular flow architecture.
 */

import { createAccessLoginFlow } from './access-login-flow';
import type { TicketFormData, UserInfo } from '../utils/flow-context';

interface FlowParams {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
  userInfo: UserInfo;
}

interface ChatState {
  userInput: string;
}

interface FlowStep {
  message: string | ((chatState: ChatState) => string);
  options?: string[];
  checkboxes?: { items: string[]; min?: number; max?: number };
  chatDisabled?: boolean;
  component?: React.ReactNode;
  validateTextInput?: (input: string) => boolean | string;
  renderHtml?: string[];
  function?: (chatState: ChatState) => void | Promise<void>;
  path: string | ((chatState: ChatState) => string);
}

type Flow = Record<string, FlowStep>;

/**
 * Creates the combined ticket flow with type selection and all ticket types
 */
export function createTicketFlow({ ticketForm, setTicketForm, userInfo }: FlowParams): Flow {
  // Import individual ticket flows
  const accessLoginFlow = createAccessLoginFlow({ ticketForm, setTicketForm, userInfo });

  // Future: Add more ticket flows here
  // const affiliatedLoginFlow = createAffiliatedLoginFlow({ ticketForm, setTicketForm, userInfo });
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
      chatDisabled: true,
      function: (chatState: ChatState) => {
        setTicketForm(prev => ({ ...prev, ticketType: chatState.userInput }));
      },
      path: (chatState: ChatState) => {
        if (chatState.userInput === "Logging into ACCESS website") {
          return "access_help";
        } else if (chatState.userInput === "Logging into a resource") {
          // TODO: Implement affiliated login flow
          return "help_ticket"; // For now, stay on selection
        } else if (chatState.userInput === "Another question") {
          // TODO: Implement general help flow
          return "help_ticket"; // For now, stay on selection
        }
        return "help_ticket";
      },
    },

    // Combine all ticket flows
    ...accessLoginFlow,
    // Future: ...affiliatedLoginFlow,
    // Future: ...generalHelpFlow,
  };
}

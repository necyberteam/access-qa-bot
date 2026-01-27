/**
 * Ticket Flow Combiner
 *
 * Combines the ticket type selection with individual ticket flows.
 * This demonstrates the modular flow architecture.
 */

import { createAccessLoginFlow } from './access-login-flow';
import { createResourceLoginFlow } from './resource-login-flow';
import { createGeneralHelpFlow } from './general-help-flow';
import type { TicketFormData, UserInfo } from '../utils/flow-context';
import type { TrackEventFn } from '../utils/analytics';

interface FlowParams {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
  userInfo: UserInfo;
  trackEvent: TrackEventFn;
}

interface ChatState {
  userInput: string;
}

// Map user-facing options to ticket type identifiers for analytics
const TICKET_TYPE_MAP: Record<string, string> = {
  "Logging into ACCESS website": "access_login",
  "Logging into a resource": "resource_login",
  "Another question": "general_help",
};

/**
 * Creates the combined ticket flow with type selection and all ticket types
 */
export function createTicketFlow({ ticketForm, setTicketForm, userInfo, trackEvent }: FlowParams) {
  // Create individual ticket flows
  const accessLoginFlow = createAccessLoginFlow({ ticketForm, setTicketForm, userInfo, trackEvent });
  const resourceLoginFlow = createResourceLoginFlow({ ticketForm, setTicketForm, userInfo, trackEvent });
  const generalHelpFlow = createGeneralHelpFlow({ ticketForm, setTicketForm, userInfo, trackEvent });

  return {
    // Ticket type selection
    help_ticket: {
      message: "What is your help ticket related to?",
      options: [
        "Logging into ACCESS website",
        "Logging into a resource",
        "Another question",
      ],
      function: (chatState: ChatState) => {
        setTicketForm(prev => ({ ...prev, ticketType: chatState.userInput }));
        
        // Track ticket started
        trackEvent({
          type: 'chatbot_ticket_started',
          ticketType: TICKET_TYPE_MAP[chatState.userInput] || chatState.userInput,
        });
      },
      path: (chatState: ChatState) => {
        if (chatState.userInput === "Logging into ACCESS website") {
          return "access_help";
        } else if (chatState.userInput === "Logging into a resource") {
          return "resource_help";
        } else if (chatState.userInput === "Another question") {
          return "general_help_summary_subject";
        }
        return "help_ticket";
      },
    },

    // Combine all ticket flows
    ...accessLoginFlow,
    ...resourceLoginFlow,
    ...generalHelpFlow,
  };
}

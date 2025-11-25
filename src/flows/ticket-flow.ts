/**
 * Ticket Flow Combiner
 *
 * Combines the ticket type selection with individual ticket flows.
 * This demonstrates the modular flow architecture.
 */

import { createAccessLoginFlow } from './access-login-flow';
import { createResourceLoginFlow } from './resource-login-flow';
import type { TicketFormData, UserInfo } from '../utils/flow-context';
import { resolveFlow, type FlowInput, type ChatState, type Flow } from '../utils/flow-helpers';

interface FlowParams {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
  userInfo: UserInfo;
}

/**
 * Creates the combined ticket flow with type selection and all ticket types
 *
 * Note: chatDisabled is auto-detected based on options:
 * - Steps with options → buttons only (no text input)
 * - Steps without options → text input enabled
 */
export function createTicketFlow({ ticketForm, setTicketForm, userInfo }: FlowParams): Flow {
  // Create individual ticket flows
  const accessLoginFlow = createAccessLoginFlow({ ticketForm, setTicketForm, userInfo });
  const resourceLoginFlow = createResourceLoginFlow({ ticketForm, setTicketForm, userInfo });

  // Future: Add more ticket flows here
  // const generalHelpFlow = createGeneralHelpFlow({ ticketForm, setTicketForm, userInfo });

  const ticketSelection: FlowInput = {
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
  };

  return {
    // Resolve the ticket selection step
    ...resolveFlow(ticketSelection),
    // Combine all ticket flows (already resolved)
    ...accessLoginFlow,
    ...resourceLoginFlow,
    // Future: ...generalHelpFlow,
  };
}

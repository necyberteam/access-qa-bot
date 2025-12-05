import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react';
import { QABot, applyFlowSettings } from '@snf/qa-bot-core';
import type { AccessQABotProps, AccessQABotRef } from '../types';
import { API_CONFIG, BOT_CONFIG } from '../config/constants';
import { createMainMenuFlow, createTicketFlow, createSecurityFlow, createMetricsFlow } from '../flows';
import { setCurrentFormContext, type TicketFormData, type UserInfo } from '../utils/flow-context';
import { getSessionId } from '../utils/session';
import '../styles/chatbot.css';

/**
 * AccessQABot - Wrapper around @snf/qa-bot-core with ACCESS-specific functionality
 *
 * This component demonstrates how to extend qa-bot-core with custom flows:
 * 1. Main menu flow - provides top-level navigation
 * 2. Ticket flows - handles ticket creation with file uploads
 *
 * The wrapper pattern keeps ACCESS-specific logic (JIRA integration, ticket forms)
 * separate from the generic qa-bot-core library.
 */
export const AccessQABot = forwardRef<AccessQABotRef, AccessQABotProps>(
  (props, ref) => {
    const {
      apiKey = API_CONFIG.DEFAULT_API_KEY,
      isLoggedIn = false,
      loginUrl = BOT_CONFIG.LOGIN_URL,
      // User context for pre-filling forms
      userEmail,
      userName,
      accessId,
      // Unused props (accepted for API compatibility)
      ringEffect: _ringEffect,
      defaultOpen: _defaultOpen,
      onClose: _onClose,
      // Active props
      open,
      onOpenChange,
      embedded = false,
      welcome,
    } = props;

    const botRef = useRef<any>(null);

    // Ticket form state - managed here to persist across flow steps
    const [ticketForm, setTicketForm] = useState<TicketFormData>({});

    // User info from props
    const userInfo: UserInfo = useMemo(() => ({
      email: userEmail,
      name: userName,
      accessId: accessId,
    }), [userEmail, userName, accessId]);

    // Keep form context in sync for flow utilities
    useEffect(() => {
      setCurrentFormContext({
        ticketForm,
        setTicketForm,
      });
    }, [ticketForm]);

    // Expose addMessage method via ref (maintains old API)
    useImperativeHandle(ref, () => ({
      addMessage: (message: string) => {
        botRef.current?.addMessage?.(message);
      },
    }));

    // Determine welcome message based on login state
    const welcomeMessage = welcome ||
      (isLoggedIn ? BOT_CONFIG.WELCOME_MESSAGE : BOT_CONFIG.WELCOME_MESSAGE_LOGGED_OUT);

    // Get session ID for metrics flow
    const sessionId = useMemo(() => getSessionId(), []);

    // Build custom flow by combining main menu + all specialized flows
    const customFlow = useMemo(() => {
      // Main menu provides top-level navigation
      const mainMenuFlow = createMainMenuFlow({
        welcome: welcomeMessage,
        setTicketForm,
        isLoggedIn,
      });

      // Ticket flows handle ticket creation
      const ticketFlows = createTicketFlow({
        ticketForm,
        setTicketForm,
        userInfo,
      });

      // Security flow for reporting security incidents
      const securityFlow = createSecurityFlow({
        ticketForm,
        setTicketForm,
        userInfo,
      });

      // Metrics flow for XDMoD questions
      const metricsFlow = createMetricsFlow({
        sessionId,
        apiKey,
      });

      // Merge all flows and apply settings
      const rawFlow = {
        ...mainMenuFlow,
        ...ticketFlows,
        ...securityFlow,
        ...metricsFlow,
      };

      // Auto-set chatDisabled based on whether step has options/checkboxes
      return applyFlowSettings(rawFlow, { disableOnOptions: true });
    }, [welcomeMessage, ticketForm, userInfo, sessionId, apiKey, isLoggedIn]);

    return (
      <QABot
        ref={botRef}
        // Login state - Q&A is gated when false, tickets/security work regardless
        isLoggedIn={isLoggedIn}

        // API configuration
        apiKey={apiKey}
        qaEndpoint={API_CONFIG.QA_ENDPOINT}
        ratingEndpoint={API_CONFIG.RATING_ENDPOINT}

        // Branding
        botName={BOT_CONFIG.BOT_NAME}
        logo={BOT_CONFIG.LOGO}
        primaryColor={BOT_CONFIG.PRIMARY_COLOR}
        secondaryColor={BOT_CONFIG.SECONDARY_COLOR}
        welcomeMessage={welcomeMessage}
        tooltipText={BOT_CONFIG.TOOLTIP}

        // UI Control
        loginUrl={loginUrl}
        open={open}
        onOpenChange={onOpenChange}
        embedded={embedded}

        // Footer
        footerText="Need more help?"
        footerLink="https://support.access-ci.org"

        // Custom flows for tickets, etc.
        customFlow={customFlow}
      />
    );
  }
);

AccessQABot.displayName = 'AccessQABot';

export default AccessQABot;

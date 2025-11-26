import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react';
import { QABot } from '@snf/qa-bot-core';
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

      // Merge all flows
      return {
        ...mainMenuFlow,
        ...ticketFlows,
        ...securityFlow,
        ...metricsFlow,
      };
    }, [welcomeMessage, ticketForm, userInfo, sessionId, apiKey]);

    return (
      <QABot
        ref={botRef}
        // TODO: Revisit enabled/chatDisabled defaults
        // Currently: `enabled={isLoggedIn}` controls whether the Q&A AI feature works.
        // However, the `chatDisabled` behavior in flows is confusing:
        // - react-chatbotify does NOT reliably inherit from settings.chatInput.disabled
        //   when transitioning between steps
        // - We must explicitly set `chatDisabled: false` on text input steps
        // - We must explicitly set `chatDisabled: true` on option-only steps
        // Consider:
        // 1. Adding an `isLoggedIn` prop to qa-bot-core that handles AI vs non-AI modes
        // 2. Investigating why react-chatbotify doesn't honor settings defaults on step transitions
        // 3. Whether qa-bot-core should apply smart defaults (auto-detect based on options)
        enabled={isLoggedIn}

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

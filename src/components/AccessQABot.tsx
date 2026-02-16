import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { QABot, applyFlowSettings } from '@snf/qa-bot-core';
import type { AccessQABotProps, AccessQABotRef } from '../types';
import { API_CONFIG, BOT_CONFIG } from '../config/constants';
import { createMainMenuFlow, createTicketFlow, createSecurityFlow, createMetricsFlow } from '../flows';
import { setCurrentFormContext, type TicketFormData, type UserInfo } from '../utils/flow-context';
import { getSessionId } from '../utils/session';
import type { TrackEventFn } from '../utils/analytics';
import { injectShadowDomStyles } from '../utils/shadow-dom-styles';
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
      actingUser,
      // Unused props (accepted for API compatibility)
      ringEffect: _ringEffect,
      defaultOpen: _defaultOpen,
      onClose: _onClose,
      // Active props
      open,
      onOpenChange,
      embedded = false,
      welcome,
      // Endpoint overrides
      qaEndpoint,
      ratingEndpoint,
      // Analytics
      onAnalyticsEvent,
    } = props;

    const botRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Ticket form state - managed here to persist across flow steps
    const [ticketForm, setTicketForm] = useState<TicketFormData>({});

    // User info from props
    const userInfo: UserInfo = useMemo(() => ({
      email: userEmail,
      name: userName,
      accessId: accessId,
    }), [userEmail, userName, accessId]);

    // Inject CSS overrides into shadow DOM if needed
    useEffect(() => {
      injectShadowDomStyles(containerRef.current);
    }, []);

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

    // Get session ID for analytics and metrics flow
    const sessionId = useMemo(() => getSessionId(), []);

    // Create analytics tracker that forwards events to consumer
    const trackEvent: TrackEventFn = useCallback((event) => {
      if (onAnalyticsEvent) {
        onAnalyticsEvent({
          ...event,
          type: event.type,
          timestamp: event.timestamp ?? Date.now(),
          sessionId: event.sessionId ?? sessionId,
        });
      }
    }, [onAnalyticsEvent, sessionId]);

    // Handler for core analytics events - forwards them to consumer
    const handleCoreAnalyticsEvent = useCallback((event: { type: string; [key: string]: unknown }) => {
      if (onAnalyticsEvent) {
        onAnalyticsEvent({
          ...event,
          type: event.type,
          timestamp: typeof event.timestamp === 'number' ? event.timestamp : Date.now(),
          sessionId: typeof event.sessionId === 'string' ? event.sessionId : sessionId,
        });
      }
    }, [onAnalyticsEvent, sessionId]);

    // Build custom flow by combining main menu + all specialized flows
    const customFlow = useMemo(() => {
      // Main menu provides top-level navigation
      const mainMenuFlow = createMainMenuFlow({
        welcome: welcomeMessage,
        setTicketForm,
        isLoggedIn,
        trackEvent,
      });

      // Ticket flows handle ticket creation
      const ticketFlows = createTicketFlow({
        ticketForm,
        setTicketForm,
        userInfo,
        trackEvent,
      });

      // Security flow for reporting security incidents
      const securityFlow = createSecurityFlow({
        ticketForm,
        setTicketForm,
        userInfo,
        trackEvent,
      });

      // Metrics flow for XDMoD questions
      const metricsFlow = createMetricsFlow({
        sessionId,
        apiKey,
        trackEvent,
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
    }, [welcomeMessage, ticketForm, userInfo, sessionId, apiKey, isLoggedIn, trackEvent]);

    return (
      <div ref={containerRef}>
      <QABot
        ref={botRef}
        // Login state - Q&A is gated when false, tickets/security work regardless
        isLoggedIn={isLoggedIn}
        actingUser={actingUser}

        // Analytics (temporary logging for testing)
        onAnalyticsEvent={handleCoreAnalyticsEvent}

        // API configuration
        apiKey={apiKey}
        qaEndpoint={qaEndpoint || API_CONFIG.QA_ENDPOINT}
        ratingEndpoint={ratingEndpoint || API_CONFIG.RATING_ENDPOINT}

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
        footerText="AI-powered · Privacy Notice"
        footerLink="https://support.access-ci.org/tools/access-qa-tool/privacy"

        // Custom flows for tickets, etc.
        customFlow={customFlow}
      />
      </div>
    );
  }
);

AccessQABot.displayName = 'AccessQABot';

export default AccessQABot;

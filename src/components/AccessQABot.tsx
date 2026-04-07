import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { QABot, applyFlowSettings } from '@snf/qa-bot-core';
import type { AccessQABotProps, AccessQABotRef, CapabilitiesResponse } from '../types';
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
 * 1. Main menu flow - provides top-level navigation from dynamic capabilities
 * 2. Ticket flows - handles ticket creation with file uploads
 *
 * The wrapper pattern keeps ACCESS-specific logic (JIRA integration, ticket forms,
 * capability fetching) separate from the generic qa-bot-core library.
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
      agentEndpoint,
      // Resource scoping
      resourceContext,
      // Analytics
      onAnalyticsEvent,
    } = props;

    const botRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Ticket form state - managed here to persist across flow steps
    const [ticketForm, setTicketForm] = useState<TicketFormData>({});

    // Capabilities state - fetched from the agent on mount.
    // null = still loading, object = loaded (even if empty categories on error)
    const [capabilities, setCapabilities] = useState<CapabilitiesResponse | null>(null);

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

    // Derive agent API URLs
    const agentBaseUrl = agentEndpoint || API_CONFIG.AGENT_ENDPOINT;
    const capabilitiesEndpoint = resourceContext
      ? `${agentBaseUrl}/capabilities?resource_context=${encodeURIComponent(resourceContext)}`
      : `${agentBaseUrl}/capabilities`;
    const agentRatingEndpoint = `${agentBaseUrl}/rating`;

    // Warn about common deployment misconfigurations
    useEffect(() => {
      if (agentBaseUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
        console.warn(
          '[AccessQABot] VITE_AGENT_ENDPOINT not set — agent requests will go to localhost. ' +
          'Set VITE_AGENT_ENDPOINT in your environment.'
        );
      }
      if (API_CONFIG.ALLOW_ANON_ACCESS && !API_CONFIG.TURNSTILE_SITE_KEY) {
        console.warn(
          '[AccessQABot] Anonymous access is enabled without Turnstile. ' +
          'Set VITE_TURNSTILE_SITE_KEY for bot protection, or disable VITE_ALLOW_ANON_ACCESS.'
        );
      }
    }, [agentBaseUrl]);

    // Fetch capabilities on mount (and when auth state changes)
    useEffect(() => {
      let cancelled = false;

      async function fetchCapabilities() {
        try {
          const response = await fetch(capabilitiesEndpoint, {
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error(`Capabilities API returned ${response.status}`);
          }
          const data: CapabilitiesResponse = await response.json();
          if (!cancelled) {
            setCapabilities(data);
          }
        } catch (error) {
          // Graceful degradation — render the bot with fallback "Show my options" button
          console.warn('Failed to fetch capabilities:', error);
          if (!cancelled) {
            setCapabilities({ categories: [], is_authenticated: false });
          }
        }
      }

      fetchCapabilities();
      return () => { cancelled = true; };
    }, [capabilitiesEndpoint, isLoggedIn]);

    // Lazy-load personalized context for authenticated users (F.4 will use this)
    useEffect(() => {
      if (!isLoggedIn) return;

      let cancelled = false;
      const personalizedUrl = `${agentBaseUrl}/capabilities/personalized`;

      async function fetchPersonalized() {
        try {
          const response = await fetch(personalizedUrl, {
            credentials: 'include',
          });
          if (!response.ok) return; // 401 for anonymous is expected
          const data = await response.json();
          if (!cancelled) {
            // TODO (F.4): Use highlighted_capabilities and context for
            // placeholder text rotation and agent system prompt enrichment
            console.debug('Personalized context loaded:', data);
          }
        } catch {
          // Non-critical — personalization is a nice-to-have
        }
      }

      fetchPersonalized();
      return () => { cancelled = true; };
    }, [agentBaseUrl, isLoggedIn]);

    // Expose addMessage method via ref (maintains old API)
    useImperativeHandle(ref, () => ({
      addMessage: (message: string) => {
        botRef.current?.addMessage?.(message);
      },
    }));

    // Determine welcome message based on login state
    const welcomeMessage = welcome || BOT_CONFIG.WELCOME_MESSAGE;

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
      // Main menu provides top-level navigation from dynamic capabilities
      const mainMenuFlow = createMainMenuFlow({
        welcome: welcomeMessage,
        isLoggedIn,
        trackEvent,
      });

      // Ticket flows handle ticket creation
      const ticketFlows = createTicketFlow({
        ticketForm: {},
        setTicketForm,
        userInfo,
        trackEvent,
      });

      // Security flow for reporting security incidents
      const securityFlow = createSecurityFlow({
        ticketForm: {},
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
      // BUT the start step explicitly sets chatDisabled: false to allow typing
      return applyFlowSettings(rawFlow, { disableOnOptions: true });
    }, [welcomeMessage, userInfo, sessionId, apiKey, isLoggedIn, trackEvent, capabilities]);

    // Wait for capabilities to load before rendering — the start step's
    // options are built from this data and react-chatbotify won't re-render
    // them if the flow object changes after initial mount.  The capabilities
    // endpoint is in-memory (<10ms), so the delay is imperceptible.
    if (!capabilities) {
      return <div ref={containerRef} />;
    }

    return (
      <div ref={containerRef}>
      <QABot
        ref={botRef}
        // Login state - Q&A is gated when false unless anonymous access is enabled
        isLoggedIn={isLoggedIn}
        allowAnonAccess={API_CONFIG.ALLOW_ANON_ACCESS}
        actingUser={actingUser}

        // Analytics
        onAnalyticsEvent={handleCoreAnalyticsEvent}

        // API configuration
        apiKey={apiKey}
        qaEndpoint={qaEndpoint || API_CONFIG.QA_ENDPOINT}
        ratingEndpoint={ratingEndpoint || API_CONFIG.RATING_ENDPOINT}
        capabilitiesEndpoint={capabilitiesEndpoint}
        agentRatingEndpoint={agentRatingEndpoint}

        // Branding
        botName={BOT_CONFIG.BOT_NAME}
        logo={BOT_CONFIG.LOGO}
        primaryColor={BOT_CONFIG.PRIMARY_COLOR}
        secondaryColor={BOT_CONFIG.SECONDARY_COLOR}
        welcomeMessage={welcomeMessage}
        tooltipText={BOT_CONFIG.TOOLTIP}

        // Turnstile bot protection (silent pre-verify when site key configured)
        turnstileSiteKey={API_CONFIG.TURNSTILE_SITE_KEY || undefined}

        // UI Control
        loginUrl={loginUrl}
        open={open}
        onOpenChange={onOpenChange}
        embedded={embedded}

        // Footer
        footerText="AI-powered · Privacy Notice"
        footerLink="https://support.access-ci.org/tools/access-qa-tool/privacy"

        // Resource scoping
        resourceContext={resourceContext}

        // Custom flows for tickets, etc.
        customFlow={customFlow}
      />
      </div>
    );
  }
);

AccessQABot.displayName = 'AccessQABot';

export default AccessQABot;

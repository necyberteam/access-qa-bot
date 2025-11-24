import { forwardRef, useImperativeHandle, useRef } from 'react';
import { QABot } from '@snf/qa-bot-core';
import type { AccessQABotProps, AccessQABotRef } from '../types';
import { API_CONFIG, BOT_CONFIG } from '../config/constants';
import '../styles/chatbot.css';

/**
 * AccessQABot - Wrapper around @snf/qa-bot-core with ACCESS-specific functionality
 * Maintains API compatibility with old @snf/access-qa-bot
 */
export const AccessQABot = forwardRef<AccessQABotRef, AccessQABotProps>(
  (props, ref) => {
    const {
      apiKey = API_CONFIG.DEFAULT_API_KEY,
      isLoggedIn = false,
      loginUrl = BOT_CONFIG.LOGIN_URL,
      // These are accepted for API compatibility but not yet used
      userEmail: _userEmail,
      userName: _userName,
      accessId: _accessId,
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

    // Debug logging
    console.log('=== AccessQABot Debug ===');
    console.log('API Key from prop:', apiKey);
    console.log('API Key from config:', API_CONFIG.DEFAULT_API_KEY);
    console.log('QA Endpoint:', API_CONFIG.QA_ENDPOINT);
    console.log('ENV check:', {
      VITE_API_KEY: import.meta.env.VITE_API_KEY,
      VITE_API_ENDPOINT: import.meta.env.VITE_API_ENDPOINT,
    });

    // Expose addMessage method via ref (maintains old API)
    useImperativeHandle(ref, () => ({
      addMessage: (message: string) => {
        botRef.current?.addMessage?.(message);
      },
    }));

    // Determine welcome message based on login state
    const welcomeMessage = welcome ||
      (isLoggedIn ? BOT_CONFIG.WELCOME_MESSAGE : BOT_CONFIG.WELCOME_MESSAGE_LOGGED_OUT);

    return (
      <QABot
        ref={botRef}
        // TODO: Once qa-bot-core adds isLoggedIn prop, use it instead of enabled
        // For now, qa-bot-core only has 'enabled' prop
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
      />
    );
  }
);

AccessQABot.displayName = 'AccessQABot';

export default AccessQABot;

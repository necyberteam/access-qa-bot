/**
 * Standalone JavaScript API for @snf/access-qa-bot
 * For use without a module bundler via <script> tag
 */

import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AccessQABot } from './components/AccessQABot';
import type { QABotStandaloneConfig, QABotController, AccessQABotRef } from './types';
import './styles/chatbot.css';

/**
 * Initialize the ACCESS QA Bot in a DOM element
 * @param config - Configuration object
 * @returns Controller object with methods to control the bot
 */
export function qaBot(config: QABotStandaloneConfig): QABotController {
  const { target, ...props } = config;

  if (!target) {
    throw new Error('qaBot: target element is required');
  }

  // Create a ref to access bot methods
  const botRef = createRef<AccessQABotRef>();

  // Track state
  let currentIsLoggedIn = props.isLoggedIn || false;
  let currentOpen = props.open !== undefined ? props.open : props.defaultOpen || false;

  // Create root and render
  const root = createRoot(target);

  const render = () => {
    root.render(
      <AccessQABot
        ref={botRef}
        {...props}
        isLoggedIn={currentIsLoggedIn}
        open={currentOpen}
        onOpenChange={(open) => {
          currentOpen = open;
          props.onOpenChange?.(open);
        }}
      />
    );
  };

  // Initial render
  render();

  // Return controller
  return {
    /**
     * Add a message to the chat programmatically
     */
    addMessage(message: string) {
      botRef.current?.addMessage(message);
    },

    /**
     * Update the user's login state
     */
    setBotIsLoggedIn(status: boolean) {
      currentIsLoggedIn = status;
      render();
    },

    /**
     * Open the chat window
     */
    openChat() {
      currentOpen = true;
      render();
    },

    /**
     * Close the chat window
     */
    closeChat() {
      currentOpen = false;
      render();
    },

    /**
     * Toggle the chat window open/closed
     */
    toggleChat() {
      currentOpen = !currentOpen;
      render();
    },

    /**
     * Destroy the bot instance and clean up
     */
    destroy() {
      root.unmount();
    },
  };
}

// Export as default for standalone bundle
export default qaBot;

// Make available on window object for standalone usage
if (typeof window !== 'undefined') {
  (window as any).qaBot = qaBot;
}

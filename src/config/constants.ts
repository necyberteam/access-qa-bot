// Environment configuration
export const API_CONFIG = {
  // Q&A API endpoints
  QA_ENDPOINT: import.meta.env.VITE_API_ENDPOINT || 'https://access-ai-grace1-external.ccs.uky.edu/access/chat/api/',
  RATING_ENDPOINT: import.meta.env.VITE_RATING_ENDPOINT || 'https://access-ai-grace1-external.ccs.uky.edu/access/chat/rating/',

  // Netlify functions for JIRA/JSM
  NETLIFY_BASE_URL: import.meta.env.VITE_NETLIFY_BASE_URL || 'https://access-jsm-api.netlify.app',

  // API key (can be overridden via prop)
  DEFAULT_API_KEY: import.meta.env.VITE_API_KEY || 'demo-key',
};

// Bot configuration defaults
export const BOT_CONFIG = {
  BOT_NAME: 'ACCESS Q&A',
  LOGO: 'https://support.access-ci.org/themes/contrib/asp-theme/images/icons/ACCESS-arrrow.svg',
  WELCOME_MESSAGE: 'Hello! What can I help you with?',
  WELCOME_MESSAGE_LOGGED_OUT: 'To ask questions, please log in.',
  LOGIN_URL: '/login',
  PRIMARY_COLOR: '#1a5b6e',
  SECONDARY_COLOR: '#107180',
  TOOLTIP: 'Ask me about ACCESS! 😊',
};

// Session storage keys
export const STORAGE_KEYS = {
  SESSION_ID: 'access-qa-bot-session-id',
  TOOLTIP_SHOWN: 'access-qa-bot-tooltip-shown',
};

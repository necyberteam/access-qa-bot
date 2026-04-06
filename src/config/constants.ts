// Environment configuration
export const API_CONFIG = {
  // Q&A API endpoints (UKY RAG)
  QA_ENDPOINT: import.meta.env.VITE_API_ENDPOINT || 'https://access-ai-grace1-external.ccs.uky.edu/access/chat/api/',
  RATING_ENDPOINT: import.meta.env.VITE_RATING_ENDPOINT || 'https://access-ai-grace1-external.ccs.uky.edu/access/chat/rating/',

  // Access-agent endpoints (capabilities, agent ratings)
  // VITE_AGENT_ENDPOINT must be set in production — localhost default is for local dev only.
  AGENT_ENDPOINT: import.meta.env.VITE_AGENT_ENDPOINT || 'http://localhost:8000/api/v1',
  get CAPABILITIES_ENDPOINT() { return `${this.AGENT_ENDPOINT}/capabilities`; },
  get AGENT_RATING_ENDPOINT() { return `${this.AGENT_ENDPOINT}/rating`; },

  // Metrics/XDMoD API endpoints
  METRICS_API_ENDPOINT: import.meta.env.VITE_METRICS_API_ENDPOINT || 'https://access-ai-grace1-external.ccs.uky.edu/access/xdmod/chat/api/',
  METRICS_RATING_ENDPOINT: import.meta.env.VITE_METRICS_RATING_ENDPOINT || 'https://access-ai-grace1-external.ccs.uky.edu/access/xdmod/chat/rating/',
  METRICS_QUESTIONS_URL: 'https://metrics.access-ci.org/qa_bot_faq',

  // Netlify functions for JIRA/JSM
  NETLIFY_BASE_URL: import.meta.env.VITE_NETLIFY_BASE_URL || 'https://access-jsm-api.netlify.app',

  // API key (can be overridden via prop)
  DEFAULT_API_KEY: import.meta.env.VITE_API_KEY || 'demo-key',

  // Cloudflare Turnstile site key (public, safe to embed in frontend)
  TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',

  // Allow anonymous users to chat without logging in.
  // Requires Turnstile for bot protection — if anon access is enabled
  // without a Turnstile key, anonymous users get unrestricted access.
  ALLOW_ANON_ACCESS: import.meta.env.VITE_ALLOW_ANON_ACCESS === 'true',
};

// Bot configuration defaults
export const BOT_CONFIG = {
  BOT_NAME: 'ACCESS Q&A',
  LOGO: 'https://support.access-ci.org/themes/contrib/asp-theme/images/icons/ACCESS-arrrow.svg',
  WELCOME_MESSAGE: 'Hello! I can answer questions about ACCESS resources, allocations, software, system status, events, and more. Click <strong>Show my options</strong> to see example queries, or just type your question.\n\n<em>This assistant is powered by AI. Responses may not always be accurate. Do not share passwords or secrets.</em> <a href="https://support.access-ci.org/tools/access-qa-tool/privacy">Privacy Notice</a>',
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

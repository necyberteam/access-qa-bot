/**
 * Capability item from the /api/v1/capabilities endpoint
 */
export interface CapabilityItem {
  id: string;
  label: string;
  description: string;
  requires_auth: boolean;
  locked?: boolean;
}

/**
 * Category grouping from the /api/v1/capabilities endpoint
 */
export interface CapabilityCategory {
  id: string;
  label: string;
  order: number;
  capabilities: CapabilityItem[];
}

/**
 * Response shape from GET /api/v1/capabilities
 */
export interface CapabilitiesResponse {
  categories: CapabilityCategory[];
  is_authenticated: boolean;
  login_url?: string;
  resource_context?: { slug: string; title: string };
  welcome_message?: string;
}

/**
 * Analytics event from AccessQABot
 * Includes both core events (from qa-bot-core) and Layer 2 events (ACCESS-specific)
 */
export interface AccessQABotAnalyticsEvent {
  type: string;
  sessionId?: string;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Props for the AccessQABot React component
 * Maintains API compatibility with old @snf/access-qa-bot
 */
export interface AccessQABotProps {
  // Authentication & User Context
  apiKey?: string;              // API key for backend services
  isLoggedIn?: boolean;         // User authentication state
  loginUrl?: string;            // Redirect path for login (default: "/login")
  userEmail?: string;           // Pre-populate user email
  userName?: string;            // Pre-populate user name
  accessId?: string;            // Pre-populate ACCESS ID
  actingUser?: string;          // Acting user identifier forwarded to backend

  // UI Control (Floating Mode)
  open?: boolean;               // Control chat window visibility
  onOpenChange?: (open: boolean) => void; // Callback when window state changes

  // Display Mode
  embedded?: boolean;           // Embedded (always visible) vs floating mode

  // Customization
  welcome?: string;             // Custom welcome message
  ringEffect?: boolean;         // Enable tooltip ring animation
  defaultOpen?: boolean;        // Initial open state

  // Endpoint overrides (default to API_CONFIG constants)
  qaEndpoint?: string;          // Override Q&A API endpoint (UKY RAG)
  ratingEndpoint?: string;      // Override UKY RAG rating endpoint
  agentEndpoint?: string;       // Override access-agent base URL (e.g., http://localhost:8000/api/v1)

  // Resource scoping
  resourceContext?: string;     // RP slug for resource-scoped queries (e.g. 'delta')

  // Callbacks
  onClose?: () => void;         // Callback when chat closes
  
  /**
   * Callback for analytics events.
   * Receives both core events (qa_bot_opened, qa_question_asked, etc.)
   * and Layer 2 events (chatbot_menu_selected, chatbot_ticket_submitted, etc.)
   */
  onAnalyticsEvent?: (event: AccessQABotAnalyticsEvent) => void;
}

/**
 * Ref methods exposed by AccessQABot component
 */
export interface AccessQABotRef {
  addMessage(message: string): void;
}

/**
 * Configuration for standalone qaBot() function
 */
export interface QABotStandaloneConfig extends Omit<AccessQABotProps, 'onClose'> {
  target: HTMLElement;          // REQUIRED: DOM element to mount into
}

/**
 * Controller returned by standalone qaBot() function
 */
export interface QABotController {
  addMessage(message: string): void;
  setBotIsLoggedIn(status: boolean): void;
  openChat(): void;
  closeChat(): void;
  toggleChat(): void;
  destroy(): void;
}

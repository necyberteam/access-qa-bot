/**
 * Type declarations for @snf/qa-bot-core
 * TODO: Remove this file once qa-bot-core exports proper TypeScript definitions
 */

declare module '@snf/qa-bot-core' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react';

  // Re-export Flow type from react-chatbotify for convenience
  export type Flow = Record<string, unknown>;

  export interface QABotProps {
    // Required props
    apiKey: string;
    qaEndpoint: string;
    welcomeMessage: string;

    /**
     * Whether the user is currently logged in.
     * - Required: this bot expects login state to be tracked
     * - Controls header icon (login button when false, user icon when true)
     * - When false, Q&A is gated by default (shows login prompt)
     */
    isLoggedIn: boolean;

    // Optional props
    ratingEndpoint?: string;
    primaryColor?: string;
    secondaryColor?: string;
    botName?: string;
    logo?: string;
    placeholder?: string;
    errorMessage?: string;
    embedded?: boolean;
    footerText?: string;
    footerLink?: string;
    tooltipText?: string;
    loginUrl?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;

    /**
     * Allow anonymous access to Q&A even when not logged in.
     * - Default: false (Q&A is gated when isLoggedIn is false)
     * - Set to true to bypass login gating for Q&A
     * - Does not affect custom flows (tickets, security, etc.)
     */
    allowAnonAccess?: boolean;

    /**
     * Custom flow steps to merge with the built-in Q&A flow.
     * Use this to add ticket creation flows, feedback flows, etc.
     */
    customFlow?: Flow;

    /**
     * Callback for analytics events from qa-bot-core.
     * Events include: chatbot_open, chatbot_close, chatbot_question_sent,
     * chatbot_answer_received, chatbot_answer_error, chatbot_rating_sent,
     * chatbot_new_chat, chatbot_login_prompt_shown
     */
    onAnalyticsEvent?: (event: QABotAnalyticsEvent) => void;
  }

  /**
   * Analytics event from qa-bot-core
   */
  export interface QABotAnalyticsEvent {
    type: string;
    sessionId: string;
    timestamp: string;
    [key: string]: unknown;
  }

  export interface BotControllerHandle {
    addMessage(message: string): void;
    openChat(): void;
    closeChat(): void;
    toggleChat(): void;
    setBotEnabled(enabled: boolean): void;
  }

  export const QABot: ForwardRefExoticComponent<QABotProps & RefAttributes<BotControllerHandle>>;

  // Flow utilities
  export interface FlowSettingsOptions {
    /**
     * Automatically set chatDisabled based on step type:
     * - Steps with options/checkboxes → chatDisabled: true
     * - Steps without → chatDisabled: false
     *
     * Only applies to steps that don't already have chatDisabled explicitly set.
     */
    disableOnOptions?: boolean;
  }

  /**
   * Apply settings/transformations to a flow object.
   *
   * @param flow - The flow configuration to process
   * @param options - Settings to apply
   * @returns A new flow object with settings applied
   */
  export function applyFlowSettings(flow: Flow, options: FlowSettingsOptions): Flow;

  /**
   * Wraps a message function to ensure its return value is captured in session history.
   * Use this for dynamic messages (like success messages) that need to be restored.
   */
  export function withHistoryFn<T extends (...args: unknown[]) => string>(fn: T): T;

  // File upload components and utilities
  export interface FileUploadComponentProps {
    onFileUpload: (files: File[]) => void;
    maxSizeMB?: number;
    acceptedTypes?: string;
    enableScreenshot?: boolean;
    className?: string;
  }

  export const FileUploadComponent: React.FC<FileUploadComponentProps>;

  export interface ScreenshotCaptureResult {
    captureScreenshot: () => Promise<File>;
    isCapturing: boolean;
    isScreenCaptureAvailable: boolean;
  }

  export function useScreenshotCapture(): ScreenshotCaptureResult;

  export interface ProcessedFile {
    fileName: string;
    contentType: string;
    size: number;
    fileData: string;
  }

  export function fileToBase64(file: File): Promise<ProcessedFile>;
  export function filesToBase64(files: File[]): Promise<ProcessedFile[]>;
  export function validateFileSize(file: File, maxMB?: number): boolean;
  export function formatFileSize(bytes: number): string;
}

/**
 * Type declarations for @snf/qa-bot-core
 * TODO: Remove this file once qa-bot-core exports proper TypeScript definitions
 */

declare module '@snf/qa-bot-core' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react';

  export interface QABotProps {
    // Required props
    apiKey: string;
    qaEndpoint: string;
    welcomeMessage: string;

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
    enabled?: boolean;
    loginUrl?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export interface BotControllerHandle {
    addMessage(message: string): void;
    openChat(): void;
    closeChat(): void;
    toggleChat(): void;
    setBotEnabled(enabled: boolean): void;
  }

  export const QABot: ForwardRefExoticComponent<QABotProps & RefAttributes<BotControllerHandle>>;
}

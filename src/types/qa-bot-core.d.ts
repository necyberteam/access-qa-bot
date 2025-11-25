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

    /**
     * Custom flow steps to merge with the built-in Q&A flow.
     * Use this to add ticket creation flows, feedback flows, etc.
     */
    customFlow?: Flow;
  }

  export interface BotControllerHandle {
    addMessage(message: string): void;
    openChat(): void;
    closeChat(): void;
    toggleChat(): void;
    setBotEnabled(enabled: boolean): void;
  }

  export const QABot: ForwardRefExoticComponent<QABotProps & RefAttributes<BotControllerHandle>>;

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

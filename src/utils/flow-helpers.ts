/**
 * Flow helper utilities
 *
 * Provides shared types and helpers for creating conversation flows
 * with sensible defaults.
 */

import type { ReactNode } from 'react';

export interface ChatState {
  userInput: string;
  prevPath?: string;
}

export type FlowPath = string | ((chatState: ChatState) => string);

/**
 * Raw flow step - what you write when defining flows
 * chatDisabled is optional and will be auto-detected based on options
 */
export interface FlowStepInput {
  message: string | ((chatState: ChatState) => string);
  options?: string[];
  checkboxes?: { items: string[]; min?: number; max?: number };
  chatDisabled?: boolean; // Optional - auto-detected if not specified
  component?: ReactNode;
  validateTextInput?: (input: string) => boolean | string;
  renderHtml?: string[];
  function?: (chatState: ChatState) => void | Promise<void>;
  path: FlowPath;
}

/**
 * Resolved flow step - with chatDisabled always set
 */
export interface FlowStep extends FlowStepInput {
  chatDisabled: boolean;
}

export type Flow = Record<string, FlowStep>;
export type FlowInput = Record<string, FlowStepInput>;

/**
 * Applies smart defaults to a flow step:
 * - If options or checkboxes exist → chatDisabled = true (use buttons)
 * - If no options/checkboxes → chatDisabled = false (allow text input)
 * - Explicit chatDisabled value always wins
 */
export function resolveStep(step: FlowStepInput): FlowStep {
  const hasOptionsOrCheckboxes = (step.options && step.options.length > 0) ||
                                  (step.checkboxes && step.checkboxes.items.length > 0);

  return {
    ...step,
    chatDisabled: step.chatDisabled ?? hasOptionsOrCheckboxes ?? false,
  };
}

/**
 * Applies smart defaults to an entire flow
 */
export function resolveFlow(flow: FlowInput): Flow {
  const resolved: Flow = {};
  for (const [key, step] of Object.entries(flow)) {
    resolved[key] = resolveStep(step);
  }
  return resolved;
}




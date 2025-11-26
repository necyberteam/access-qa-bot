/**
 * Metrics/XDMoD Flow
 *
 * Conversational flow for asking questions about usage and performance metrics.
 * Based on the old qa-bot's metrics-flow.js with exact language preserved.
 */

import { v4 as uuidv4 } from 'uuid';
import { API_CONFIG } from '../config/constants';

interface FlowParams {
  sessionId: string;
  apiKey: string;
}

interface ChatState {
  userInput: string;
  injectMessage: (message: string) => Promise<void>;
}

/**
 * Process text response from API - basic markdown/HTML handling
 */
function processResponse(text: string): string {
  // Basic processing - the core bot may handle this too
  return text;
}

/**
 * Creates the Metrics/XDMoD conversation flow
 */
export function createMetricsFlow({ sessionId, apiKey }: FlowParams) {
  // Track the query ID for the most recent response that can receive feedback
  let feedbackQueryId: string | null = null;

  return {
    // Entry point with instructions
    metrics_intro: {
      message: `Please type your question about usage and performance metrics (XDMoD) below. You can see some <a target="_blank" href="${API_CONFIG.METRICS_QUESTIONS_URL}">examples here</a>.`,
      renderHtml: ["BOT"],
      chatDisabled: false,
      path: "metrics_loop",
    },

    // Main question/answer loop
    metrics_loop: {
      message: async (chatState: ChatState) => {
        const { userInput } = chatState;

        // Handle feedback first if it's feedback
        if (userInput === "👍 Helpful" || userInput === "👎 Not helpful") {
          // Send feedback using the captured query ID
          if (apiKey && sessionId && feedbackQueryId) {
            const isPositive = userInput === "👍 Helpful";
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'X-Origin': 'metrics',
              'X-API-KEY': apiKey,
              'X-Session-ID': sessionId,
              'X-Query-ID': feedbackQueryId,
              'X-Feedback': isPositive ? '1' : '0',
            };

            try {
              await fetch(API_CONFIG.METRICS_RATING_ENDPOINT, {
                method: 'POST',
                headers,
              });
            } catch (error) {
              console.error('Error sending metrics feedback:', error);
            }
          }
          return "Thanks for the feedback! Ask another question about usage and performance metrics (XDMoD) or start a new chat.";
        } else {
          // Process as a question - fetch response directly
          try {
            // Generate our own query ID
            const queryId = uuidv4();
            feedbackQueryId = queryId;

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'X-Origin': 'metrics',
              'X-API-KEY': apiKey,
              'X-Session-ID': sessionId,
              'X-Query-ID': queryId,
            };

            const response = await fetch(API_CONFIG.METRICS_API_ENDPOINT, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                query: userInput,
              }),
            });

            const body = await response.json();
            const text = body.response;
            const processedText = processResponse(text);

            // Inject the response
            await chatState.injectMessage(processedText);

            // Inject guidance message after a short delay
            setTimeout(async () => {
              await chatState.injectMessage("Ask another question about usage and performance metrics (XDMoD) or start a new chat.");
            }, 100);

            return null;
          } catch (error) {
            console.error('Error in metrics flow:', error);
            return "I'm sorry, there was an error processing your question. Please try again.";
          }
        }
      },
      renderMarkdown: ["BOT"],
      options: (chatState: ChatState) => {
        // Only show feedback options if the input isn't already feedback
        if (chatState.userInput === "👍 Helpful" || chatState.userInput === "👎 Not helpful") {
          return []; // No options after feedback is given
        }
        return ["👍 Helpful", "👎 Not helpful"];
      },
      chatDisabled: false,
      path: "metrics_loop",
    },
  };
}


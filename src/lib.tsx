/**
 * Library exports for @snf/access-qa-bot
 * React component usage
 */

// qa-bot-core's extracted stylesheet must be imported explicitly (>=0.2.39);
// its ESM/CJS bundle no longer auto-injects styles. Import it first so that
// access-qa-bot's own overrides in chatbot.css take precedence.
import '@snf/qa-bot-core/styles';
import './styles/chatbot.css';

export { AccessQABot as QABot, AccessQABot } from './components/AccessQABot';

export type {
  AccessQABotProps as QABotProps,
  AccessQABotRef as QABotRef,
  QABotStandaloneConfig,
  QABotController,
} from './types';

export { API_CONFIG, BOT_CONFIG } from './config/constants';

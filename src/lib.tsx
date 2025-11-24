/**
 * Library exports for @snf/access-qa-bot
 * React component usage
 */

import './styles/chatbot.css';

export { AccessQABot as QABot, AccessQABot } from './components/AccessQABot';
export { ThumbsUpThumbsDown } from './components/ThumbsUpThumbsDown';

export type {
  AccessQABotProps as QABotProps,
  AccessQABotRef as QABotRef,
  QABotStandaloneConfig,
  QABotController,
} from './types';

export { API_CONFIG, BOT_CONFIG } from './config/constants';

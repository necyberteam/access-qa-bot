import { API_CONFIG } from '../config/constants';

export interface QARequest {
  query: string;
  sessionId: string;
  queryId: string;
}

export interface QAResponse {
  answer: string;
  queryId: string;
}

export interface RatingRequest {
  feedback: number; // 1 for positive, 0 for negative
}

/**
 * Send a Q&A query to the ACCESS API
 */
export async function sendQAQuery(
  query: string,
  sessionId: string,
  queryId: string,
  apiKey: string,
  qaEndpoint?: string
): Promise<QAResponse> {
  const endpoint = qaEndpoint || API_CONFIG.QA_ENDPOINT;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
      'X-Query-ID': queryId,
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit feedback rating for a Q&A response
 */
export async function submitRating(
  sessionId: string,
  queryId: string,
  feedback: number,
  apiKey: string,
  ratingEndpoint?: string
): Promise<void> {
  const endpoint = ratingEndpoint || API_CONFIG.RATING_ENDPOINT;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
      'X-Query-ID': queryId,
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ feedback }),
  });

  if (!response.ok) {
    throw new Error(`Rating submission failed: ${response.statusText}`);
  }
}

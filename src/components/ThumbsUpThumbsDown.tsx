import React, { useState } from 'react';
import { submitRating } from '../utils/api';

export interface ThumbsUpThumbsDownProps {
  sessionId: string;
  queryId: string;
  apiKey: string;
  ratingEndpoint?: string;
  onFeedbackSubmitted?: (feedback: number) => void;
}

/**
 * ThumbsUpThumbsDown - Feedback component for Q&A responses
 */
export const ThumbsUpThumbsDown: React.FC<ThumbsUpThumbsDownProps> = ({
  sessionId,
  queryId,
  apiKey,
  ratingEndpoint,
  onFeedbackSubmitted,
}) => {
  const [feedback, setFeedback] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (value: number) => {
    if (feedback !== null || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(value);

    try {
      await submitRating(sessionId, queryId, value, apiKey, ratingEndpoint);
      onFeedbackSubmitted?.(value);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedback !== null) {
    return (
      <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
        {feedback === 1 ? '✓ Thanks for your feedback!' : '✓ Thanks for letting us know.'}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: '#666' }}>Was this helpful?</span>
      <button
        onClick={() => handleFeedback(1)}
        disabled={isSubmitting}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '4px 8px',
        }}
        title="Helpful"
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback(0)}
        disabled={isSubmitting}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '4px 8px',
        }}
        title="Not helpful"
      >
        👎
      </button>
    </div>
  );
};

export default ThumbsUpThumbsDown;

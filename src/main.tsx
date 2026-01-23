/**
 * Development entry point for testing the component
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AccessQABot } from './components/AccessQABot';
import './styles.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>ACCESS QA Bot - Development</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setIsLoggedIn(!isLoggedIn)}>
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>
        <button onClick={() => setIsOpen(!isOpen)} style={{ marginLeft: '10px' }}>
          {isOpen ? 'Close Chat' : 'Open Chat'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p>Login Status: {isLoggedIn ? 'Logged In' : 'Logged Out'}</p>
        <p>Chat Status: {isOpen ? 'Open' : 'Closed'}</p>
      </div>

      <AccessQABot
        isLoggedIn={isLoggedIn}
        open={isOpen}
        onOpenChange={setIsOpen}
        // apiKey will default to env var
        embedded={false}
        welcome="Hello! How can I help you today?"
        // Mock user data when logged in (simulates Drupal passing user context)
        userEmail={isLoggedIn ? "testuser@university.edu" : undefined}
        userName={isLoggedIn ? "Test User" : undefined}
        accessId={isLoggedIn ? "testuser123" : undefined}
        // Analytics logging for development
        onAnalyticsEvent={(event) => {
          console.log('[Analytics]', event.type, event);
        }}
      />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

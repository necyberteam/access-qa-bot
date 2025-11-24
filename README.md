# ACCESS QA Bot

A React wrapper around [@snf/qa-bot-core](https://github.com/necyberteam/qa-bot-core) with ACCESS-specific functionality.

This package is designed to be used as both a standalone component and as a library consumed by access-ci-ui.

## Installation

```bash
npm install @snf/access-qa-bot
```

## Usage

### React Component

```tsx
import { QABot } from '@snf/access-qa-bot';

function MyApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <QABot
      isLoggedIn={isLoggedIn}
      open={isOpen}
      onOpenChange={setIsOpen}
      apiKey="your-api-key"
      userEmail="user@example.com"
      userName="John Doe"
      accessId="ABC123"
      embedded={false}
      welcome="Hello! How can I help you today?"
    />
  );
}
```

### Standalone JavaScript

```html
<div id="qa-bot"></div>
<script src="https://unpkg.com/@snf/access-qa-bot@3.0.0/dist/access-qa-bot.standalone.js"></script>
<script>
  const bot = qaBot({
    target: document.getElementById('qa-bot'),
    isLoggedIn: true,
    apiKey: 'your-api-key',
    embedded: false
  });

  // Programmatic control
  bot.openChat();
  bot.addMessage('Hello!');
  bot.setBotIsLoggedIn(false);
</script>
```

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoggedIn` | `boolean` | `false` | User authentication state |
| `apiKey` | `string` | - | API key for backend services |
| `open` | `boolean` | - | Control chat window visibility |
| `onOpenChange` | `(open: boolean) => void` | - | Callback when window state changes |
| `embedded` | `boolean` | `false` | Embedded vs floating mode |
| `loginUrl` | `string` | `"/login"` | Login redirect URL |
| `userEmail` | `string` | - | Pre-populate user email |
| `userName` | `string` | - | Pre-populate user name |
| `accessId` | `string` | - | Pre-populate ACCESS ID |
| `welcome` | `string` | - | Custom welcome message |
| `defaultOpen` | `boolean` | - | Initial open state (standalone only) |

### Ref Methods

```tsx
const botRef = useRef<QABotRef>(null);

// Add message programmatically
botRef.current?.addMessage('Hello from code!');
```

### Standalone Controller

```javascript
const bot = qaBot(config);

bot.addMessage(message: string)
bot.setBotIsLoggedIn(status: boolean)
bot.openChat()
bot.closeChat()
bot.toggleChat()
bot.destroy()
```

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
VITE_API_ENDPOINT=https://your-api-endpoint.com/api/
VITE_RATING_ENDPOINT=https://your-api-endpoint.com/rating/
VITE_NETLIFY_BASE_URL=https://access-jsm-api.netlify.app
VITE_API_KEY=your_api_key_here
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build library
npm run build

# Type check
npm run type-check
```

## Architecture

This wrapper maintains API compatibility with the old `@snf/access-qa-bot` while leveraging `@snf/qa-bot-core` for core functionality. It:

- Accepts `isLoggedIn` prop (access-ci-ui compatibility)
- Passes it to qa-bot-core (currently as `enabled`, will use `isLoggedIn` once available)
- Adds ACCESS-specific branding and configuration
- Provides Q&A flow with thumbs up/down feedback
- Supports both React component and standalone usage

## Future Features

- Additional conversation flows (ticket creation, security incidents)
- File attachment support
- Full feature parity with old qa-bot

## License

MIT

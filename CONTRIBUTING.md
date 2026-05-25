# Contributing to DockerDash

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (for testing container detection)
- Git

### Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/dockerdash.git
cd dockerdash
npm run install:all
```

### Run in Development Mode

You need two terminals:

```bash
# Terminal 1 -- backend (port 3000)
cd server && npm run dev

# Terminal 2 -- frontend (port 5173, proxies API to backend)
cd client && npm run dev
```

Open http://localhost:5173 in your browser.

### Build Docker Image Locally

```bash
docker build -t dockerdash:latest .
docker run -p 3080:3000 -v /var/run/docker.sock:/var/run/docker.sock:ro dockerdash:latest
```

## Project Structure

```
dockerdash/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # TopBar, WidgetGrid, SettingsPanel, etc.
│   │   ├── context/        # DashboardContext (global state)
│   │   ├── i18n/           # Translations (11 languages)
│   │   ├── widgets/        # 12 widget components + registry
│   │   ├── hooks/          # useApi helper
│   │   ├── themes/         # CSS variables for 5 themes
│   │   └── types/          # Shared TypeScript interfaces
│   └── vite.config.ts
├── server/                 # Node.js backend (Express + SQLite)
│   └── src/
│       ├── db/             # Database init and helpers
│       ├── routes/         # API route handlers
│       └── services/       # Docker scanner, uptime monitor
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Ready-to-use deployment config
└── .env.example            # Environment variable reference
```

## How to Contribute

### Reporting Bugs

Open an [issue](../../issues) with:
- What you expected vs. what happened
- Steps to reproduce
- Your environment (OS, Docker version, browser)

### Suggesting Features

Open an issue with the `enhancement` label. Describe the use case and why it would be useful.

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test locally (both dev mode and Docker build)
5. Submit a pull request

### Adding a New Widget

1. Create `client/src/widgets/YourWidget.tsx`
2. Register it in `client/src/widgets/registry.ts`
3. Add translation keys in `client/src/i18n/translations.ts`
4. If it needs a backend API, add a route in `server/src/routes/`

### Adding a New Language

1. Open `client/src/i18n/translations.ts`
2. Add a new entry to the `LANGUAGES` array
3. Create a new `TranslationMap` with translated strings (use `en` as reference)
4. Add it to the `allTranslations` object

## Code Style

- TypeScript everywhere (strict mode)
- Functional React components with hooks
- Inline styles using CSS variables from the theme system
- No external CSS frameworks

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

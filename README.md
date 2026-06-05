# DockerDash

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)

A beautiful, self-hosted Docker dashboard that auto-detects your containers and gives you a fully customizable home page for your server. No config files, no YAML editing -- everything is managed through a point-and-click GUI.

## Features

- **Auto-Detection** -- Finds all your Docker containers and creates clickable links automatically
- **12 Widgets** -- Weather, RSS news, stock ticker, calendar, bookmarks, system monitor, to-do list, sticky notes, speed test, uptime monitor, IP/network info, and Docker services
- **Drag & Drop Layout** -- Move and resize widgets freely with a visual editor
- **5 Themes** -- Dark Neon, Glassmorphism, Minimal Light, Material Dark, Cyberpunk
- **11 Languages** -- English, 简体中文, 繁體中文, Español, Français, Deutsch, 日本語, 한국어, Português, Русский, العربية (with RTL)
- **Smart Header** -- Time-based greeting, health status pills, and universal service search (`Ctrl+K`)
- **GUI Everything** -- All settings, services, and layout managed through the web interface
- **Manual Services** -- Add any URL (NAS, router, apps) alongside auto-detected containers
- **Export / Import** -- Backup and restore your entire configuration as JSON
- **Lightweight** -- ~150MB Docker image, SQLite database, no external dependencies

## Quick Start

### 1. Create `docker-compose.yml`

```yaml
services:
  dockerdash:
    image: dockerdash:latest
    build: .
    container_name: dockerdash
    ports:
      - "3080:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - dockerdash_data:/app/data
    environment:
      - HOST_URL=http://YOUR_SERVER_IP
    restart: unless-stopped

volumes:
  dockerdash_data:
```

> Replace `YOUR_SERVER_IP` with your server's IP (run `hostname -I` on Linux or `ipconfig` on Windows to find it).

### 2. Start

```bash
docker compose up -d
```

### 3. Open

Go to **http://YOUR_SERVER_IP:3080** in your browser.

## Usage

### Managing Widgets

1. Click the **pencil icon** (top-right) to enter Edit Mode
2. The Widget Gallery opens -- click **+** to add any widget
3. **Drag** widgets to rearrange, **pull corners** to resize
4. Click the **gear icon** on a widget to configure it
5. Click the pencil icon again to save your layout

### Adding Custom Services

1. Open **Settings** (gear icon) > **Services** tab
2. Click **"Add a Service Manually"**
3. Fill in name, URL, optional group and description
4. Click **Add Service**

Auto-detected Docker containers and manual services appear side by side.

### Changing Language

1. Open **Settings** > **General** tab
2. Click any language to switch instantly

### API Keys for Widgets

Some widgets need a free API key:

| Widget | Free Key From |
|--------|--------------|
| Weather | [openweathermap.org](https://openweathermap.org/api) |
| Stock Ticker | [alphavantage.co](https://www.alphavantage.co/support/#api-key) |
| RSS Feed | No key needed -- just add feed URLs |

Enter Edit Mode, click the gear on the widget, and paste your key.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST_URL` | Your server's IP/hostname for container links | *(auto-detect)* |
| `DASHBOARD_TITLE` | Title shown at the top | `DockerDash` |
| `PORT` | Internal port (rarely needs changing) | `3000` |

## Optional: System Monitoring

To enable CPU, RAM, and disk stats, add these volumes:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - dockerdash_data:/app/data
  - /proc:/host/proc:ro
  - /sys:/host/sys:ro
```

## Docker Labels (Advanced)

Optionally customize how auto-detected containers appear:

```yaml
services:
  plex:
    image: plexinc/pms-docker
    labels:
      - "dockerdash.name=Plex Media Server"
      - "dockerdash.group=Media"
      - "dockerdash.url=http://192.168.1.100:32400"
      - "dockerdash.description=Movies and TV"
```

This is entirely optional -- you can manage everything from the Settings UI.

## Building from Source

```bash
git clone https://github.com/eden-cheung-yk/Docker-frontpage.git
cd dockerdash
npm run install:all

# Development (two terminals)
cd server && npm run dev     # Backend on port 3000
cd client && npm run dev     # Frontend on port 5173

# Or build the Docker image
docker build -t dockerdash:latest .
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, react-grid-layout |
| Backend | Node.js 22, Express 5, SQLite (better-sqlite3) |
| Docker | Dockerode, multi-stage Alpine build |
| Icons | Lucide React |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No containers detected | Mount Docker socket: `-v /var/run/docker.sock:/var/run/docker.sock:ro` |
| Container links don't work | Set `HOST_URL` to your server's IP in docker-compose.yml or Settings > Docker |
| Weather/Stocks not loading | Add a free API key via the widget's gear icon in Edit Mode |
| Can't access dashboard | Check port 3080 isn't firewalled. Run `curl http://localhost:3080/api/health` on the server |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) -- free to use, modify, and distribute.

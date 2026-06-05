# DockerDash

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GHCR](https://img.shields.io/badge/GHCR-ghcr.io-blue?logo=github)](https://github.com/eden-cheung-yk/Docker-frontpage/pkgs/container/docker-frontpage)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)

A beautiful, self-hosted Docker dashboard that auto-detects your containers and gives you a fully customizable home page for your server. No config files, no YAML editing -- everything is managed through a point-and-click GUI.

**Pre-built image:** `ghcr.io/eden-cheung-yk/docker-frontpage:latest`

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

## Quick Start (Docker Compose)

The fastest way to run DockerDash — no build step required.

### 1. Create `docker-compose.yml`

```yaml
services:
  dockerdash:
    image: ghcr.io/eden-cheung-yk/docker-frontpage:latest
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

> Replace `YOUR_SERVER_IP` with your server's IP (run `hostname -I` on Linux or `ipconfig` on Windows).

**Linux users:** if containers are not detected, set your host's Docker group ID before starting:
```bash
export DOCKER_GID=$(getent group docker | cut -d: -f3)
```
Then add under the service in `docker-compose.yml`:
```yaml
    group_add:
      - "${DOCKER_GID}"
```

### 2. Pull and start

```bash
docker compose pull
docker compose up -d
```

### 3. Open

Go to **http://YOUR_SERVER_IP:3080** in your browser.

---

## Alternative: Docker Run (no Compose)

```bash
docker pull ghcr.io/eden-cheung-yk/docker-frontpage:latest

docker run -d \
  --name dockerdash \
  --restart unless-stopped \
  -p 3080:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v dockerdash_data:/app/data \
  -e HOST_URL=http://YOUR_SERVER_IP \
  ghcr.io/eden-cheung-yk/docker-frontpage:latest
```

---

## Updating

Pull the latest image and recreate the container:

```bash
docker compose pull
docker compose up -d
```

Your settings and layout are stored in the `dockerdash_data` volume and are preserved across updates.

---

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

### Changing Language

1. Open **Settings** > **General** tab
2. Click any language to switch instantly

### API Keys for Widgets

| Widget | Free Key From |
|--------|--------------|
| Weather | [openweathermap.org](https://openweathermap.org/api) |
| Stock Ticker | [alphavantage.co](https://www.alphavantage.co/support/#api-key) |
| RSS Feed | No key needed -- just add feed URLs |

Enter Edit Mode, click the gear on the widget, and paste your key.

## Environment Variables

Set these under `environment` in `docker-compose.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST_URL` | Your server's IP/hostname for container links | *(empty)* |
| `PORT` | Internal port (rarely needs changing) | `3000` |
| `DATA_DIR` | SQLite database path inside container | `/app/data` |

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

## Building from Source

For development or if you prefer to build locally instead of pulling from GHCR:

```bash
git clone https://github.com/eden-cheung-yk/Docker-frontpage.git
cd Docker-frontpage
npm run install:all

# Development (two terminals)
cd server && npm run dev     # Backend on port 3000
cd client && npm run dev     # Frontend on port 5173

# Build and run locally
docker build -t docker-frontpage:local .
docker compose -f docker-compose.yml up -d   # temporarily set image: docker-frontpage:local
```

CI automatically builds and publishes `ghcr.io/eden-cheung-yk/docker-frontpage:latest` on every push to `main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, react-grid-layout |
| Backend | Node.js 22, Express 5, SQLite (better-sqlite3) |
| Docker | Dockerode, multi-stage Alpine build, GHCR |
| Icons | Lucide React |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't pull image | Ensure the [GHCR package](https://github.com/eden-cheung-yk/Docker-frontpage/pkgs/container/docker-frontpage) is public, or run `docker login ghcr.io` |
| No containers detected | Mount Docker socket: `-v /var/run/docker.sock:/var/run/docker.sock:ro`. On Linux, set `DOCKER_GID` (see Quick Start) |
| Container links don't work | Set `HOST_URL` to your server's IP in docker-compose.yml or Settings > Docker |
| Weather/Stocks not loading | Add a free API key via the widget's gear icon in Edit Mode |
| Can't access dashboard | Check port 3080 isn't firewalled. Run `curl http://localhost:3080/api/health` on the server |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) -- free to use, modify, and distribute.

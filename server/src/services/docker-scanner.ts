import Dockerode from 'dockerode';
import { getSetting } from '../db/database.js';

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: { private: number; public: number; type: string }[];
  labels: Record<string, string>;
  url: string | null;
  icon: string | null;
  group: string | null;
  description: string | null;
  created: number;
}

let cachedContainers: ContainerInfo[] = [];
let scanInterval: ReturnType<typeof setInterval> | null = null;
let docker: Dockerode | null = null;

function getDockerClient(): Dockerode | null {
  const socketPath = getSetting('dockerSocketPath') || '/var/run/docker.sock';
  try {
    return new Dockerode({ socketPath });
  } catch (err) {
    console.warn('Failed to create Docker client:', err);
    return null;
  }
}

function extractPorts(container: Dockerode.ContainerInfo): { private: number; public: number; type: string }[] {
  return (container.Ports || [])
    .filter((p) => p.PublicPort)
    .map((p) => ({
      private: p.PrivatePort,
      public: p.PublicPort!,
      type: p.Type,
    }));
}

function generateUrl(ports: { private: number; public: number; type: string }[], hostUrl: string): string | null {
  if (!ports.length) return null;
  const host = hostUrl || 'http://localhost';
  const port = ports[0].public;
  const base = host.replace(/\/$/, '');
  return `${base}:${port}`;
}

export async function scanContainers(hostUrl: string): Promise<ContainerInfo[]> {
  if (!docker) {
    docker = getDockerClient();
  }
  if (!docker) return [];

  try {
    const containers = await docker.listContainers({ all: true });
    const filter = getSetting('containerFilter') || '';
    const filterPatterns = filter ? filter.split(',').map((f) => f.trim().toLowerCase()) : [];

    const results: ContainerInfo[] = [];

    for (const c of containers) {
      const labels = c.Labels || {};

      if (labels['dockerdash.enable'] === 'false') continue;

      const name = (c.Names?.[0] || '').replace(/^\//, '');

      if (filterPatterns.length > 0) {
        const matchesFilter = filterPatterns.some(
          (p) => name.toLowerCase().includes(p) || (c.Image || '').toLowerCase().includes(p)
        );
        if (!matchesFilter && labels['dockerdash.enable'] !== 'true') continue;
      }

      const ports = extractPorts(c);

      results.push({
        id: c.Id,
        name: labels['dockerdash.name'] || name,
        image: c.Image,
        status: c.Status,
        state: c.State,
        ports,
        labels,
        url: labels['dockerdash.url'] || generateUrl(ports, hostUrl),
        icon: labels['dockerdash.icon'] || null,
        group: labels['dockerdash.group'] || null,
        description: labels['dockerdash.description'] || null,
        created: c.Created,
      });
    }

    cachedContainers = results;
    return results;
  } catch (err) {
    console.warn('Docker scan failed:', err instanceof Error ? err.message : err);
    return cachedContainers;
  }
}

export function getContainers(): ContainerInfo[] {
  return cachedContainers;
}

export function startScanning(intervalSeconds: number): void {
  if (scanInterval) clearInterval(scanInterval);

  const hostUrl = getSetting('hostUrl') || '';
  scanContainers(hostUrl).catch(() => {});

  scanInterval = setInterval(() => {
    const currentHostUrl = getSetting('hostUrl') || '';
    scanContainers(currentHostUrl).catch(() => {});
  }, intervalSeconds * 1000);

  console.log(`Docker scanning started (every ${intervalSeconds}s)`);
}

export function stopScanning(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
    console.log('Docker scanning stopped');
  }
}

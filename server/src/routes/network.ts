import { Router, Request, Response } from 'express';
import os from 'os';
import fetch from 'node-fetch';

const router = Router();

function getInternalIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

router.get('/info', async (_req: Request, res: Response) => {
  try {
    let externalIp = null;
    try {
      const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
      const data = (await response.json()) as { ip: string };
      externalIp = data.ip;
    } catch {
      // External IP unavailable
    }

    res.json({
      hostname: os.hostname(),
      internalIp: getInternalIp(),
      externalIp,
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      networkInterfaces: Object.entries(os.networkInterfaces()).reduce(
        (acc, [name, ifaces]) => {
          acc[name] = (ifaces || []).map((iface) => ({
            address: iface.address,
            family: iface.family,
            internal: iface.internal,
          }));
          return acc;
        },
        {} as Record<string, { address: string; family: string; internal: boolean }[]>
      ),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get network info' });
  }
});

export default router;

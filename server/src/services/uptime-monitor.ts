import db from '../db/database.js';

interface UptimeTarget {
  id: string;
  name: string;
  url: string;
  check_interval: number;
  timeout: number;
}

interface UptimeStatus {
  targetId: string;
  name: string;
  url: string;
  isUp: boolean;
  responseTime: number | null;
  lastChecked: string | null;
}

const timers = new Map<string, ReturnType<typeof setInterval>>();

async function checkTarget(target: UptimeTarget): Promise<void> {
  const start = Date.now();
  let isUp = false;
  let responseTime: number | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), target.timeout);

    const res = await fetch(target.url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    responseTime = Date.now() - start;
    isUp = res.ok || res.status < 500;
  } catch {
    responseTime = Date.now() - start;
    isUp = false;
  }

  db.prepare('INSERT INTO uptime_history (target_id, is_up, response_time) VALUES (?, ?, ?)').run(
    target.id,
    isUp ? 1 : 0,
    responseTime
  );

  const count = db
    .prepare('SELECT COUNT(*) as cnt FROM uptime_history WHERE target_id = ?')
    .get(target.id) as { cnt: number };
  if (count.cnt > 100) {
    db.prepare(
      `DELETE FROM uptime_history WHERE id IN (
        SELECT id FROM uptime_history WHERE target_id = ? ORDER BY timestamp ASC LIMIT ?
      )`
    ).run(target.id, count.cnt - 100);
  }
}

function scheduleTarget(target: UptimeTarget): void {
  if (timers.has(target.id)) {
    clearInterval(timers.get(target.id)!);
  }

  checkTarget(target).catch(() => {});

  const timer = setInterval(() => {
    checkTarget(target).catch(() => {});
  }, target.check_interval * 1000);

  timers.set(target.id, timer);
}

export function startMonitoring(): void {
  const targets = db.prepare('SELECT * FROM uptime_targets').all() as UptimeTarget[];
  for (const target of targets) {
    scheduleTarget(target);
  }
  console.log(`Uptime monitoring started for ${targets.length} target(s)`);
}

export function stopMonitoring(): void {
  for (const [id, timer] of timers) {
    clearInterval(timer);
    timers.delete(id);
  }
  console.log('Uptime monitoring stopped');
}

export function refreshTarget(targetId: string): void {
  const target = db.prepare('SELECT * FROM uptime_targets WHERE id = ?').get(targetId) as UptimeTarget | undefined;
  if (target) {
    scheduleTarget(target);
  }
}

export function removeTarget(targetId: string): void {
  const timer = timers.get(targetId);
  if (timer) {
    clearInterval(timer);
    timers.delete(targetId);
  }
}

export function getStatus(): UptimeStatus[] {
  const targets = db.prepare('SELECT * FROM uptime_targets').all() as UptimeTarget[];
  return targets.map((target) => {
    const latest = db
      .prepare('SELECT * FROM uptime_history WHERE target_id = ? ORDER BY timestamp DESC LIMIT 1')
      .get(target.id) as { is_up: number; response_time: number; timestamp: string } | undefined;

    return {
      targetId: target.id,
      name: target.name,
      url: target.url,
      isUp: latest ? latest.is_up === 1 : false,
      responseTime: latest?.response_time ?? null,
      lastChecked: latest?.timestamp ?? null,
    };
  });
}

export function getHistory(targetId: string) {
  return db
    .prepare('SELECT * FROM uptime_history WHERE target_id = ? ORDER BY timestamp DESC LIMIT 100')
    .all(targetId) as Record<string, unknown>[];
}

import type { Response } from "express";

export type RealtimeEvent = {
  type: "catalog.updated" | "order.updated" | "payment.updated" | "blog.updated" | "system.notice";
  scope?: "public" | "buyer" | "admin";
  userId?: number;
  data?: Record<string, unknown>;
};

const clients = new Set<Response>();

export function subscribeRealtime(res: Response) {
  clients.add(res);
  res.write(`event: ready\ndata: ${JSON.stringify({ connectedAt: Date.now() })}\n\n`);
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 20_000);
  return () => {
    clearInterval(heartbeat);
    clients.delete(res);
  };
}

export function publishRealtime(event: RealtimeEvent) {
  const message = `event: ${event.type}\ndata: ${JSON.stringify({ ...event, sentAt: Date.now() })}\n\n`;
  for (const client of Array.from(clients)) {
    if (client.writableEnded) {
      clients.delete(client);
      continue;
    }
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
}

export function realtimeClientCount() {
  return clients.size;
}

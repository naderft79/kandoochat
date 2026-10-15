// رویدادهای real-time حضور کاربران — broadcast سراسری به SSE listener ها
export type PresencePayload = {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
};

type Listener = (data: PresencePayload) => void;

const listeners = new Set<Listener>();

export function subscribePresence(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishPresence(data: PresencePayload) {
  for (const listener of listeners) {
    try { listener(data); } catch { /* ignore */ }
  }
}

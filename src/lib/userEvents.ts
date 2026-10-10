// رویدادهای real-time سطح کاربر — اعلان ها، پیام های نخوانده و تغییر موجودی
type Listener = (event: string, data: unknown) => void;

// Map روی globalThis نگه داشته می شود تا بین route bundle های جداگانه Next.js
// و hot reload در dev یک نمونه مشترک بماند — وگرنه publish به گوش های خالی می رسد
const globalForEvents = globalThis as unknown as {
  __kandooUserListeners?: Map<string, Set<Listener>>;
};

const listeners = (globalForEvents.__kandooUserListeners ??= new Map());

export function subscribeToUser(userId: string, listener: Listener): () => void {
  if (!listeners.has(userId)) listeners.set(userId, new Set());
  listeners.get(userId)!.add(listener);
  return () => {
    listeners.get(userId)?.delete(listener);
    if (listeners.get(userId)?.size === 0) listeners.delete(userId);
  };
}

export function publishToUser(userId: string, event: string, data: unknown) {
  const set = listeners.get(userId);
  if (!set) return;
  for (const listener of set) {
    try { listener(event, data); } catch { /* ignore */ }
  }
}

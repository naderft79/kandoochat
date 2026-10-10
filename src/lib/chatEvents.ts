// رویدادهای real-time چت — broadcast به SSE listener های هر گفتگو
type Listener = (event: string, data: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeToConversation(conversationId: string, listener: Listener): () => void {
  if (!listeners.has(conversationId)) listeners.set(conversationId, new Set());
  listeners.get(conversationId)!.add(listener);
  return () => {
    listeners.get(conversationId)?.delete(listener);
    if (listeners.get(conversationId)?.size === 0) listeners.delete(conversationId);
  };
}

export function publishToConversation(conversationId: string, event: string, data: unknown) {
  const set = listeners.get(conversationId);
  if (!set) return;
  for (const listener of set) {
    try { listener(event, data); } catch { /* ignore */ }
  }
}

// سیستم Event Emitter برای broadcast پیام های جدید به SSE listeners
type Listener = (message: unknown) => void;

const chatListeners = new Set<Listener>();
const photoListeners = new Set<Listener>();

export function subscribeLiveChat(listener: Listener): () => void {
  chatListeners.add(listener);
  return () => { chatListeners.delete(listener); };
}

export function subscribeLivePhotos(listener: Listener): () => void {
  photoListeners.add(listener);
  return () => { photoListeners.delete(listener); };
}

function notify(listeners: Set<Listener>, message: unknown) {
  for (const listener of listeners) {
    try { listener(message); } catch { /* ignore */ }
  }
}

export function broadcastNewMessage(message: unknown) {
  notify(chatListeners, message);
}

export function broadcastNewPhoto(message: unknown) {
  notify(photoListeners, message);
}

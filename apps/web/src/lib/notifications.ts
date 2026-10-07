export interface SystemNotification {
  id: string;
  time: string;
  title: string;
  message: string;
  type: 'gate' | 'ticket' | 'alert';
}

export const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'n1',
    time: '18:00 IST',
    title: 'GATES ACTIVE',
    message: 'Turnstiles open at HITEX Exhibition Centre for Deccan Fusion.',
    type: 'gate',
  },
  {
    id: 'n2',
    time: '17:30 IST',
    title: 'PASS VERIFIED',
    message: 'Cryptographic HMAC gate pass issued and synced with scanner network.',
    type: 'ticket',
  },
  {
    id: 'n3',
    time: '14:00 IST',
    title: 'TIER ALLOCATION',
    message: 'High demand detected: VIP All-Access passes under atomic lock limit.',
    type: 'alert',
  },
];

export function getSystemNotifications(): SystemNotification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem('pulsepass_notifications');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_NOTIFICATIONS;
}

export function addSystemNotification(notif: {
  title: string;
  message: string;
  type: 'gate' | 'ticket' | 'alert';
}) {
  if (typeof window === 'undefined') return;
  const now = new Date();
  const time =
    now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' IST';
  const item: SystemNotification = {
    id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    time,
    title: notif.title,
    message: notif.message,
    type: notif.type,
  };
  try {
    const current = getSystemNotifications();
    const updated = [item, ...current].slice(0, 15);
    localStorage.setItem('pulsepass_notifications', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('pulsepass:notification'));
  } catch {
    // ignore
  }
}

export function clearSystemNotifications() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pulsepass_notifications', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('pulsepass:notification'));
  } catch {
    // ignore
  }
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardDispatcherPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!token || !stored) {
        router.replace('/login');
        return;
      }

      try {
        const user = JSON.parse(stored);
        if (user.role === 'admin') {
          router.replace('/admin');
        } else if (user.role === 'organizer') {
          router.replace('/organizer');
        } else {
          router.replace('/tickets');
        }
      } catch {
        router.replace('/login');
      }
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-paper-muted)',
        fontFamily: 'var(--font-mono-stack)',
      }}
    >
      DISPATCHING ROLE DASHBOARD...
    </div>
  );
}

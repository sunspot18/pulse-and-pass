'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'pulsepass_token=; path=/; max-age=0;';
      setCurrentUser(null);
      window.location.href = '/';
    }
  };

  return (
    <header
      style={{
        borderBottom: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-ink)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="container">
        <div className="navbar-inner">
          <div className="navbar-top-row">
            {/* Logo Lockup in Wide Display Font */}
            <Link href="/" className="navbar-brand">
              <span style={{ color: 'var(--color-cyan)', fontSize: '1rem' }}>⚡</span>
              <span>PULSE &amp; PASS</span>
            </Link>

            {/* Action: Login / Logout Button */}
            <div className="navbar-actions">
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link
                    href="/orders"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    MY WALLET
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-void)' }}
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-cyan btn-sm"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                >
                  LOGIN
                </Link>
              )}
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="navbar-nav">
            <Link
              href="/#lineup"
              className="meta-text"
              style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}
            >
              Discover
            </Link>
            <Link
              href="/orders"
              className="meta-text"
              style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}
            >
              My Tickets
            </Link>
            <Link
              href="/styleguide"
              className="meta-text"
              style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}
            >
              Styleguide
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

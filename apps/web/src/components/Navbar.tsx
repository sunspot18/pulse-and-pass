'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  getSystemNotifications,
  clearSystemNotifications,
  type SystemNotification,
} from '../lib/notifications';

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name: string;
    email: string;
    role?: 'attendee' | 'organizer' | 'admin';
  } | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        setCurrentUser(null);
      }
    }

    // Sync live notifications
    const syncNotifs = () => {
      setNotifications(getSystemNotifications());
    };

    syncNotifs();
    window.addEventListener('pulsepass:notification', syncNotifs);
    window.addEventListener('storage', syncNotifs);

    return () => {
      window.removeEventListener('pulsepass:notification', syncNotifs);
      window.removeEventListener('storage', syncNotifs);
    };
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

  const handleClearNotifications = () => {
    clearSystemNotifications();
    setNotifications([]);
  };

  const navLinks = [
    { label: 'Discover', href: '/events' },
    { label: 'My Tickets', href: '/tickets' },
    ...(currentUser?.role === 'organizer'
      ? [{ label: 'Organizer Console', href: '/organizer' }]
      : []),
    ...(currentUser?.role === 'admin' ? [{ label: 'Admin System', href: '/admin' }] : []),
  ];

  return (
    <header
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        backgroundColor: 'rgba(245, 239, 230, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background-color 0.2s ease',
      }}
    >
      <div className="container">
        <div className="navbar-inner">
          <div className="navbar-top-row">
            {/* Logo Lockup in Wide Display Font */}
            <Link href="/" className="navbar-brand">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-terracotta)',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 8px rgba(200, 75, 49, 0.3)',
                }}
              >
                ⚡
              </span>
              <span style={{ letterSpacing: '0.04em', fontWeight: 800 }}>PULSE &amp; PASS</span>
            </Link>

            {/* Action: Notifications + User Controls */}
            <div className="navbar-actions" style={{ gap: '0.75rem', position: 'relative' }}>
              {/* Notifications Bell Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="System Notifications"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: showNotifications ? 'rgba(200, 75, 49, 0.1)' : '#FFFFFF',
                    border: '1px solid rgba(20, 20, 20, 0.08)',
                    boxShadow: '0 2px 6px rgba(20, 20, 20, 0.03)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={showNotifications ? 'var(--color-terracotta)' : 'var(--color-charcoal)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {notifications.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--color-terracotta)',
                        borderRadius: '50%',
                        border: '2px solid #FFFFFF',
                      }}
                    />
                  )}
                </button>

                {/* Notifications Drawer */}
                {showNotifications && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: '340px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(20, 20, 20, 0.08)',
                      borderRadius: '16px',
                      boxShadow: '0 16px 40px rgba(20, 20, 20, 0.12)',
                      zIndex: 100,
                      padding: '1.25rem',
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(20, 20, 20, 0.06)',
                        paddingBottom: '0.65rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span
                        className="section-header-kicker"
                        style={{ fontSize: '0.75rem', margin: 0 }}
                      >
                        GATE ALERTS
                      </span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearNotifications}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-paper-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div
                        className="meta-text-sm"
                        style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-paper-muted)' }}
                      >
                        No active alerts right now
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              backgroundColor: 'var(--color-surface-warm)',
                              border: '1px solid rgba(20, 20, 20, 0.05)',
                              borderRadius: '10px',
                              padding: '0.75rem',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.25rem',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color:
                                    n.type === 'gate'
                                      ? 'var(--color-terracotta)'
                                      : n.type === 'alert'
                                        ? '#B83A24'
                                        : 'var(--color-charcoal)',
                                }}
                              >
                                {n.title}
                              </span>
                              <span className="meta-text-sm" style={{ fontSize: '0.7rem' }}>
                                {n.time}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-paper-80)' }}>
                              {n.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {currentUser ? (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
                >
                  {currentUser.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8125rem',
                        borderRadius: '9999px',
                      }}
                    >
                      Admin Panel
                    </Link>
                  )}
                  {currentUser.role === 'organizer' && (
                    <Link
                      href="/organizer"
                      className="btn btn-cyan btn-sm"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8125rem',
                        borderRadius: '9999px',
                      }}
                    >
                      Organizer
                    </Link>
                  )}
                  <Link
                    href="/tickets"
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8125rem',
                      borderRadius: '9999px',
                    }}
                  >
                    My Passes
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8125rem',
                      color: 'var(--color-paper-muted)',
                      borderRadius: '9999px',
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-cyan btn-sm btn-pill"
                  style={{
                    padding: '0.45rem 1.15rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Center Navigation Links Styled as Sleek Pills */}
          <nav className="navbar-nav">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-terracotta)' : 'var(--color-paper-80)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'rgba(200, 75, 49, 0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(200, 75, 49, 0.2)' : '1px solid transparent',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

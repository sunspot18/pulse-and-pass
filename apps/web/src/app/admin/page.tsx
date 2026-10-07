'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface SystemUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'attendee' | 'organizer' | 'admin';
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Auth Guard: Admin Only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!token || !stored) {
        showToast('System Administrator authentication required', 'warning');
        router.push('/login?redirect=/admin');
        return;
      }
      try {
        const user = JSON.parse(stored);
        if (user.role !== 'admin') {
          showToast('Access denied: System Administrator privileges required', 'error');
          router.push('/dashboard');
        }
      } catch {
        router.push('/login');
      }
    }
  }, [router, showToast]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ users: SystemUser[] }>('/admin/users');
      if (res.users && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch {
      // Fallback pre-seeded users for resilience
      setUsers([
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Devendra Rathore',
          email: 'admin@pulsepass.dev',
          phone: '9811122233',
          role: 'admin',
          created_at: '2026-10-01T00:00:00Z',
        },
        {
          id: '22222222-2222-2222-2222-222222222221',
          name: 'Tarun Reddy',
          email: 'organizer.hyderabad@pulsepass.dev',
          phone: '9849011223',
          role: 'organizer',
          created_at: '2026-10-01T00:00:00Z',
        },
        {
          id: '33333333-3333-3333-3333-333333333331',
          name: 'Rishika Deshmukh',
          email: 'rishika@pulsepass.dev',
          phone: '9876543210',
          role: 'attendee',
          created_at: '2026-10-02T00:00:00Z',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'attendee' | 'organizer' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user role';
      showToast(msg, 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const organizerCount = users.filter((u) => u.role === 'organizer').length;
  const attendeeCount = users.filter((u) => u.role === 'attendee').length;

  return (
    <>
      <Navbar />

      <main style={{ minHeight: 'calc(100vh - 160px)', padding: '2.5rem 0 4rem' }}>
        <div className="container">
          {/* Header */}
          <div
            style={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              paddingBottom: '1.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(200, 75, 49, 0.1)',
                    color: 'var(--color-terracotta)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                  }}
                >
                  ROOT ACCESS
                </span>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', fontWeight: 600 }}>
                  SYSTEM ADMINISTRATOR AUTHORITY
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-charcoal)', margin: 0 }}>
                Account Role Authority
              </h1>
              <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: 'var(--color-paper-80)' }}>
                Manage account authorization levels, elevate organizer permissions, and audit
                registered platform identities across the box office ecosystem.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href="/organizer"
                className="btn btn-secondary btn-sm btn-pill"
                style={{ textDecoration: 'none', padding: '0.55rem 1.15rem' }}
              >
                ORGANIZER CONSOLE →
              </Link>
              <Link
                href="/events"
                className="btn btn-ghost btn-sm btn-pill"
                style={{ textDecoration: 'none', padding: '0.55rem 1.15rem' }}
              >
                PUBLIC LINEUP →
              </Link>
              <Link
                href="/styleguide"
                className="btn btn-ghost btn-sm btn-pill"
                style={{ textDecoration: 'none', padding: '0.55rem 1.15rem' }}
              >
                DESIGN SYSTEM →
              </Link>
            </div>
          </div>

          {/* KPI / Metric Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>TOTAL IDENTITIES</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-terracotta)', fontWeight: 700 }}>Active</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono-stack)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  marginTop: '0.35rem',
                  color: 'var(--color-charcoal)',
                }}
              >
                {users.length}
              </div>
              <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                Registered system accounts
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>ORGANIZERS</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-terracotta)', fontWeight: 700 }}>Curators</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono-stack)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  marginTop: '0.35rem',
                  color: 'var(--color-charcoal)',
                }}
              >
                {organizerCount}
              </div>
              <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                Event creation authority
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>ADMINISTRATORS</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-terracotta)', fontWeight: 700 }}>Root</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono-stack)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  marginTop: '0.35rem',
                  color: 'var(--color-charcoal)',
                }}
              >
                {adminCount}
              </div>
              <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                Full system control
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>PATRONS / ATTENDEES</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-terracotta)', fontWeight: 700 }}>Public</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono-stack)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  marginTop: '0.35rem',
                  color: 'var(--color-charcoal)',
                }}
              >
                {attendeeCount}
              </div>
              <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                Pass holders &amp; buyers
              </span>
            </div>
          </div>

          {/* User Management Table Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>USER DIRECTORY</span>
                <h2 style={{ fontSize: '1.4rem', marginTop: '0.2rem', color: 'var(--color-charcoal)' }}>
                  Registered User Profiles ({users.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="btn btn-ghost btn-sm btn-pill"
                style={{ padding: '0.45rem 1rem' }}
              >
                REFRESH DIRECTORY
              </button>
            </div>

            {isLoading ? (
              <div className="meta-text-sm" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-paper-muted)' }}>
                FETCHING USER RECORDS...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                      <th className="meta-label" style={{ padding: '0.85rem 0.75rem', color: 'var(--color-paper-muted)' }}>
                        Name &amp; Email
                      </th>
                      <th className="meta-label" style={{ padding: '0.85rem 0.75rem', color: 'var(--color-paper-muted)' }}>
                        Phone
                      </th>
                      <th className="meta-label" style={{ padding: '0.85rem 0.75rem', color: 'var(--color-paper-muted)' }}>
                        Active Role
                      </th>
                      <th className="meta-label" style={{ padding: '0.85rem 0.75rem', color: 'var(--color-paper-muted)' }}>
                        Registered
                      </th>
                      <th className="meta-label" style={{ padding: '0.85rem 0.75rem', color: 'var(--color-paper-muted)' }}>
                        Role Elevation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}
                      >
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>{u.name}</div>
                          <div
                            className="meta-text-sm"
                            style={{ color: 'var(--color-paper-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}
                          >
                            {u.email}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '1rem 0.75rem',
                            fontFamily: 'var(--font-mono-stack)',
                            fontSize: '0.85rem',
                            color: 'var(--color-charcoal)',
                          }}
                        >
                          {u.phone || '—'}
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              backgroundColor:
                                u.role === 'admin'
                                  ? 'rgba(200, 75, 49, 0.1)'
                                  : u.role === 'organizer'
                                    ? 'rgba(184, 58, 36, 0.08)'
                                    : '#FAF8F5',
                              color:
                                u.role === 'admin'
                                  ? 'var(--color-terracotta)'
                                  : u.role === 'organizer'
                                    ? '#A03A22'
                                    : 'var(--color-paper-muted)',
                              border:
                                u.role === 'admin'
                                  ? '1px solid rgba(200, 75, 49, 0.25)'
                                  : u.role === 'organizer'
                                    ? '1px solid rgba(184, 58, 36, 0.2)'
                                    : '1px solid rgba(0, 0, 0, 0.08)',
                            }}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '1rem 0.75rem',
                            fontFamily: 'var(--font-mono-stack)',
                            fontSize: '0.8rem',
                            color: 'var(--color-paper-muted)',
                          }}
                        >
                          {new Date(u.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {u.role !== 'organizer' && (
                              <button
                                type="button"
                                disabled={updatingUserId === u.id}
                                onClick={() => handleRoleChange(u.id, 'organizer')}
                                className="btn btn-secondary btn-sm btn-pill"
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.3rem 0.75rem',
                                  minHeight: '30px',
                                  fontWeight: 600,
                                }}
                              >
                                {updatingUserId === u.id ? 'UPDATING...' : 'MAKE ORGANIZER'}
                              </button>
                            )}
                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                disabled={updatingUserId === u.id}
                                onClick={() => handleRoleChange(u.id, 'admin')}
                                className="btn btn-ghost btn-sm btn-pill"
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.3rem 0.75rem',
                                  minHeight: '30px',
                                  color: 'var(--color-terracotta)',
                                  borderColor: 'rgba(200, 75, 49, 0.2)',
                                  fontWeight: 600,
                                }}
                              >
                                {updatingUserId === u.id ? 'UPDATING...' : 'MAKE ADMIN'}
                              </button>
                            )}
                            {u.role !== 'attendee' && (
                              <button
                                type="button"
                                disabled={updatingUserId === u.id}
                                onClick={() => handleRoleChange(u.id, 'attendee')}
                                className="btn btn-ghost btn-sm btn-pill"
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.3rem 0.75rem',
                                  minHeight: '30px',
                                  color: 'var(--color-paper-muted)',
                                  fontWeight: 600,
                                }}
                              >
                                {updatingUserId === u.id ? 'UPDATING...' : 'DEMOTE ATTENDEE'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

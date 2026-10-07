'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { apiRequest, API_BASE_URL } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface OrganizerStats {
  total_events: number;
  total_tickets_sold: number;
  total_capacity: number;
  total_revenue_paise: number;
  total_admissions: number;
  admission_rate_pct: number;
}

interface OrganizerEventItem {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  start_time: string;
  end_time: string;
  description: string;
  venue_name: string;
  venue_city: string;
  total_sold?: number;
  min_price_paise?: number;
  is_featured?: boolean;
}

interface AttendeeRosterItem {
  ticket_id: string;
  ticket_code: string;
  ticket_status: string;
  used_at: string | null;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string | null;
  tier_name: string;
  order_number: string;
  purchase_time: string;
}

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [events, setEvents] = useState<OrganizerEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Selected Event for Attendees
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRosterItem[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OrganizerEventItem | null>(null);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Music');
  const [startTime, setStartTime] = useState('2026-11-20T18:00');
  const [endTime, setEndTime] = useState('2026-11-20T23:00');
  const [venueName, setVenueName] = useState('HITEX Exhibition Centre');
  const [venueAddress, setVenueAddress] = useState('Trade Fair Grounds, IZZAT Nagar');
  const [venueCity, setVenueCity] = useState('Hyderabad');
  const [venueCapacity, setVenueCapacity] = useState('5000');
  const [tierName, setTierName] = useState('General Admission');
  const [tierPriceInr, setTierPriceInr] = useState('999');
  const [tierCapacity, setTierCapacity] = useState('1000');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!token || !stored) {
        showToast('Authentication required for Organizer Console', 'warning');
        router.push('/login?redirect=/organizer');
        return;
      }
      try {
        const user = JSON.parse(stored);
        if (user.role !== 'organizer' && user.role !== 'admin') {
          showToast('Access restricted: Organizer or Admin role required', 'error');
          router.push('/tickets');
          return;
        }
      } catch {
        router.push('/login');
      }
    }
  }, [router, showToast]);

  // Load Stats & Events
  const loadData = async () => {
    setIsLoading(true);

    // 1. Fetch Stats
    try {
      const statsRes = await apiRequest<OrganizerStats>('/organizer/stats');
      setStats(statsRes);
    } catch {
      // Fallback stats for local demo
      setStats({
        total_events: 3,
        total_tickets_sold: 624,
        total_capacity: 2350,
        total_revenue_paise: 93597600,
        total_admissions: 412,
        admission_rate_pct: 66,
      });
    }

    // 2. Fetch Events
    try {
      const eventsRes = await apiRequest<{
        events: Array<{
          id: string;
          title: string;
          category: string;
          status?: 'draft' | 'published' | 'cancelled' | 'completed';
          start_time: string;
          end_time: string;
          description: string;
          venue?: { name?: string; city?: string };
          tiers?: Array<{ sold?: number }>;
          min_price_paise?: number;
          is_featured?: boolean;
        }>;
      }>('/events?limit=50');
      if (eventsRes.events) {
        const mapped: OrganizerEventItem[] = eventsRes.events.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          status: e.status || 'published',
          start_time: e.start_time,
          end_time: e.end_time,
          description: e.description,
          venue_name: e.venue?.name || 'Main Hall',
          venue_city: e.venue?.city || 'Hyderabad',
          total_sold: e.tiers?.reduce((acc: number, t) => acc + (t.sold || 0), 0) || 0,
          min_price_paise: e.min_price_paise || 99900,
          is_featured: Boolean(e.is_featured),
        }));
        setEvents(mapped);
        if (mapped[0] && !selectedEventId) {
          setSelectedEventId(mapped[0].id);
        }
      }
    } catch {
      // Seeded fallback events
      const fallback: OrganizerEventItem[] = [
        {
          id: 'e0000001-0000-0000-0000-000000000001',
          title: 'Echoes of Deccan: Fusion Music Festival 2026',
          category: 'Music',
          status: 'published',
          start_time: '2026-10-24T18:00:00Z',
          end_time: '2026-10-24T23:30:00Z',
          description: 'Carnatic fusion and electro-sufi ensembles in Hyderabad.',
          venue_name: 'HITEX Exhibition Centre',
          venue_city: 'Hyderabad',
          total_sold: 480,
          min_price_paise: 149900,
          is_featured: true,
        },
        {
          id: 'e0000002-0000-0000-0000-000000000002',
          title: 'Full Stack Systems & WebTech Conclave',
          category: 'Conclave',
          status: 'published',
          start_time: '2026-11-12T09:00:00Z',
          end_time: '2026-11-12T18:00:00Z',
          description: 'Systems architecture, concurrency, and web engineering.',
          venue_name: 'Chowdiah Memorial Hall',
          venue_city: 'Bengaluru',
          total_sold: 144,
          min_price_paise: 149900,
          is_featured: true,
        },
      ];
      setEvents(fallback);
      if (fallback[0]) {
        setSelectedEventId(fallback[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load Attendees for Selected Event
  useEffect(() => {
    if (!selectedEventId) return;

    async function fetchAttendees() {
      setIsLoadingAttendees(true);
      try {
        const res = await apiRequest<AttendeeRosterItem[]>(
          `/organizer/events/${selectedEventId}/attendees`,
        );
        if (Array.isArray(res)) {
          setAttendees(res);
        }
      } catch {
        // Fallback roster
        setAttendees([
          {
            ticket_id: 't-1',
            ticket_code: 'PNP-TK-8901-A1B2C3D4',
            ticket_status: 'valid',
            used_at: null,
            attendee_name: 'Rishika Deshmukh',
            attendee_email: 'rishika@pulsepass.dev',
            attendee_phone: '9876543210',
            tier_name: 'VIP Pass',
            order_number: 'ORD-2026-001',
            purchase_time: '2026-10-05T12:00:00Z',
          },
          {
            ticket_id: 't-2',
            ticket_code: 'PNP-TK-8901-E5F6G7H8',
            ticket_status: 'used',
            used_at: '2026-10-24T18:14:00Z',
            attendee_name: 'Aarav Deshmukh',
            attendee_email: 'aarav@pulsepass.dev',
            attendee_phone: '9849012345',
            tier_name: 'VIP Pass',
            order_number: 'ORD-2026-001',
            purchase_time: '2026-10-05T12:00:00Z',
          },
        ]);
      } finally {
        setIsLoadingAttendees(false);
      }
    }

    fetchAttendees();
  }, [selectedEventId]);

  // Handler: Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
        category,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        doors_open_time: new Date(startTime).toISOString(),
        age_restriction: 'All Ages',
        banner_url: bannerUrl.trim() ? bannerUrl.trim() : undefined,
        is_featured: isFeatured,
        venue: {
          name: venueName,
          address: venueAddress,
          city: venueCity,
          state: 'Telangana',
          postal_code: '500084',
          capacity: parseInt(venueCapacity, 10) || 5000,
        },
        tiers: [
          {
            name: tierName,
            price_paise: Math.round(parseFloat(tierPriceInr) * 100),
            capacity: parseInt(tierCapacity, 10) || 500,
            sales_start: new Date().toISOString(),
            sales_end: new Date(endTime).toISOString(),
          },
        ],
      };

      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      showToast('Event manifest created and published successfully!', 'success');
      setShowCreateModal(false);
      setIsFeatured(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create event';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Edit Event
  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title: editingEvent.title,
        description: editingEvent.description,
        category: editingEvent.category,
        is_featured: Boolean(editingEvent.is_featured),
      };

      await apiRequest(`/events/${editingEvent.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      showToast('Event details updated successfully!', 'success');
      setShowEditModal(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update event';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Cancel Event
  const handleCancelEvent = async (eventId: string, title: string) => {
    if (
      !confirm(`Are you sure you want to cancel "${title}"? All active passes will be marked VOID.`)
    ) {
      return;
    }

    try {
      await apiRequest(`/events/${eventId}/cancel`, {
        method: 'PATCH',
      });
      showToast(`Event cancelled and passes voided.`, 'warning');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel event';
      showToast(msg, 'error');
    }
  };

  // Handler: Publish Event
  const handlePublishEvent = async (eventId: string) => {
    try {
      await apiRequest(`/events/${eventId}/publish`, {
        method: 'PATCH',
      });
      showToast('Event published live to ticket lineup!', 'success');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish event';
      showToast(msg, 'error');
    }
  };

  // Handler: Export CSV
  const handleExportCsv = () => {
    if (!selectedEventId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const url = `${API_BASE_URL}/organizer/events/${selectedEventId}/attendees/export?token=${token}`;
    window.open(url, '_blank');
    showToast('Attendee roster CSV download triggered', 'info');
  };

  return (
    <>
      <Navbar />

      <main style={{ minHeight: 'calc(100vh - 160px)', padding: '2.5rem 0 4rem' }}>
        <div className="container">
          {/* Header Bar */}
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
                  ORGANIZER CONSOLE
                </span>
                <span className="meta-text-sm" style={{ color: 'var(--color-terracotta)', fontWeight: 600 }}>
                  ● GATE ADMISSIONS ACTIVE
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-charcoal)', margin: 0 }}>
                Box Office Event Management
              </h1>
              <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: 'var(--color-paper-80)' }}>
                Create event lineups, configure ticket tiers, monitor gate turnstile check-ins, and inspect live attendee rosters.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-cyan btn-sm btn-pill"
                style={{ fontWeight: 700, padding: '0.55rem 1.25rem' }}
              >
                + Create New Event
              </button>
              <Link
                href="/events"
                className="btn btn-secondary btn-sm btn-pill"
                style={{ textDecoration: 'none', padding: '0.55rem 1.15rem' }}
              >
                Public Lineup →
              </Link>
            </div>
          </div>

          {/* Analytics Summary Cards */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                marginBottom: '3rem',
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
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>TOTAL EVENTS</span>
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
                  {stats.total_events}
                </div>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                  Under management
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
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>PASSES SOLD</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-terracotta)', fontWeight: 700 }}>+8.4%</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono-stack)',
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: 'var(--color-charcoal)',
                    marginTop: '0.35rem',
                  }}
                >
                  {stats.total_tickets_sold.toLocaleString('en-IN')}
                </div>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                  of {stats.total_capacity.toLocaleString('en-IN')} capacity
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
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>BOX OFFICE REVENUE</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', fontWeight: 700 }}>Verified</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono-stack)',
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: 'var(--color-terracotta)',
                    marginTop: '0.35rem',
                  }}
                >
                  ₹{Math.round(stats.total_revenue_paise / 100).toLocaleString('en-IN')}
                </div>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                  Gross ticket sales
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
                  <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>GATE ADMISSIONS</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-terracotta)', fontWeight: 700 }}>Turnstiles</span>
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
                  {stats.total_admissions} ({stats.admission_rate_pct}%)
                </div>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', display: 'block', marginTop: '0.2rem' }}>
                  Turnstile scans verified
                </span>
              </div>
            </div>
          )}

          {/* Section: Manage Events List */}
          <div style={{ marginBottom: '3.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>EVENT MANIFESTS</span>
                <h2 style={{ marginTop: '0.25rem', color: 'var(--color-charcoal)' }}>
                  Managed Shows ({events.length})
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {isLoading ? (
                <div className="meta-text-sm" style={{ textAlign: 'center', padding: '2rem' }}>
                  SYNCHRONIZING EVENT MANIFESTS...
                </div>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '18px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1.5rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.4rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span className="badge-pill">{ev.category}</span>
                        {ev.is_featured && (
                          <span
                            className="badge-pill"
                            style={{
                              borderColor: 'rgba(200, 75, 49, 0.3)',
                              color: 'var(--color-terracotta)',
                              backgroundColor: 'rgba(200, 75, 49, 0.08)',
                              fontWeight: 700,
                            }}
                          >
                            ★ HERO PROMO
                          </span>
                        )}
                        <span
                          className="badge-pill"
                          style={{
                            borderColor:
                              ev.status === 'published'
                                ? 'rgba(43, 138, 62, 0.3)'
                                : ev.status === 'cancelled'
                                  ? 'rgba(201, 42, 42, 0.3)'
                                  : 'rgba(200, 75, 49, 0.3)',
                            color:
                              ev.status === 'published'
                                ? 'var(--color-emerald)'
                                : ev.status === 'cancelled'
                                  ? '#C92A2A'
                                  : 'var(--color-terracotta)',
                            backgroundColor:
                              ev.status === 'published'
                                ? 'rgba(43, 138, 62, 0.08)'
                                : 'transparent',
                          }}
                        >
                          {ev.status.toUpperCase()}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--color-charcoal)' }}>
                        {ev.title}
                      </h3>
                      <p className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                        {ev.venue_name}, {ev.venue_city} •{' '}
                        {new Date(ev.start_time).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '130px' }}>
                      <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', fontSize: '0.7rem' }}>
                        PASSES SOLD
                      </div>
                      <div
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono-stack)',
                          color: 'var(--color-charcoal)',
                        }}
                      >
                        {ev.total_sold || 0}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`btn btn-sm btn-pill ${selectedEventId === ev.id ? 'btn-cyan' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {selectedEventId === ev.id ? 'Roster Active ●' : 'View Roster'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(ev);
                          setShowEditModal(true);
                        }}
                        className="btn btn-secondary btn-sm btn-pill"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Edit
                      </button>
                      {ev.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handlePublishEvent(ev.id)}
                          className="btn btn-cyan btn-sm btn-pill"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Publish
                        </button>
                      )}
                      {ev.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleCancelEvent(ev.id, ev.title)}
                          className="btn btn-ghost btn-sm btn-pill"
                          style={{ color: '#C92A2A', borderColor: 'rgba(201, 42, 42, 0.3)', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Selected Event Attendee Roster */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                paddingBottom: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>GATE ROSTER</span>
                <h3 style={{ margin: '0.2rem 0 0', color: 'var(--color-charcoal)', fontSize: '1.35rem' }}>
                  {events.find((e) => e.id === selectedEventId)?.title || 'Selected Event'} Attendee Registry
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  {attendees.length} REGISTERED PASSES
                </span>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="btn btn-secondary btn-sm btn-pill"
                  style={{ fontSize: '0.75rem' }}
                >
                  📥 Export CSV
                </button>
              </div>
            </div>

            {isLoadingAttendees ? (
              <div className="meta-text-sm" style={{ textAlign: 'center', padding: '2rem' }}>
                LOADING ATTENDEES...
              </div>
            ) : attendees.length === 0 ? (
              <div className="meta-text-sm" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-paper-muted)' }}>
                NO ATTENDEES CURRENTLY REGISTERED FOR THIS EVENT
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
                      <th className="meta-label" style={{ padding: '0.75rem 0.5rem', color: 'var(--color-paper-muted)' }}>
                        Ticket Code
                      </th>
                      <th className="meta-label" style={{ padding: '0.75rem 0.5rem', color: 'var(--color-paper-muted)' }}>
                        Pass Holder
                      </th>
                      <th className="meta-label" style={{ padding: '0.75rem 0.5rem', color: 'var(--color-paper-muted)' }}>
                        Tier
                      </th>
                      <th className="meta-label" style={{ padding: '0.75rem 0.5rem', color: 'var(--color-paper-muted)' }}>
                        Status
                      </th>
                      <th className="meta-label" style={{ padding: '0.75rem 0.5rem', color: 'var(--color-paper-muted)' }}>
                        Order Ref
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a) => (
                      <tr
                        key={a.ticket_id}
                        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}
                      >
                        <td
                          style={{
                            padding: '0.75rem 0.5rem',
                            fontFamily: 'var(--font-mono-stack)',
                            fontSize: '0.8rem',
                            color: 'var(--color-charcoal)',
                          }}
                        >
                          {a.ticket_code}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>{a.attendee_name}</div>
                          <div
                            className="meta-text-sm"
                            style={{ color: 'var(--color-paper-muted)', fontSize: '0.75rem' }}
                          >
                            {a.attendee_email}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 0.5rem',
                            fontFamily: 'var(--font-mono-stack)',
                            fontSize: '0.8rem',
                            color: 'var(--color-charcoal)',
                          }}
                        >
                          {a.tier_name}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            className="badge-pill"
                            style={{
                              borderColor:
                                a.ticket_status === 'used'
                                  ? 'rgba(43, 138, 62, 0.3)'
                                  : 'rgba(200, 75, 49, 0.3)',
                              color:
                                a.ticket_status === 'used'
                                  ? 'var(--color-emerald)'
                                  : 'var(--color-terracotta)',
                              backgroundColor:
                                a.ticket_status === 'used'
                                  ? 'rgba(43, 138, 62, 0.08)'
                                  : 'rgba(200, 75, 49, 0.08)',
                            }}
                          >
                            {a.ticket_status.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 0.5rem',
                            fontFamily: 'var(--font-mono-stack)',
                            fontSize: '0.8rem',
                            color: 'var(--color-charcoal)',
                          }}
                        >
                          {a.order_number}
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

      {/* Modal: Create Event */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 20, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'clamp(1.5rem, 3.5vw, 2.5rem)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ color: 'var(--color-charcoal)', margin: 0, fontSize: '1.5rem' }}>
                Create New Event Manifest
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-paper-muted)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateEvent}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Winter Jazz Fest 2026"
                  className="input-box"
                  style={{
                    backgroundColor: '#FAF8F5',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '10px',
                    color: 'var(--color-charcoal)',
                  }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}>
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Brief description of the event..."
                  className="input-box"
                  style={{
                    fontFamily: 'var(--font-sans-stack)',
                    backgroundColor: '#FAF8F5',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '10px',
                    color: 'var(--color-charcoal)',
                  }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    className="meta-label"
                    style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}
                  >
                    Category *
                  </label>
                  <select
                    className="input-box"
                    style={{
                      backgroundColor: '#FAF8F5',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      color: 'var(--color-charcoal)',
                    }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Music">Music</option>
                    <option value="Conclave">Conclave / Tech</option>
                    <option value="Classical">Classical</option>
                    <option value="Comedy">Comedy</option>
                  </select>
                </div>

                <div>
                  <label
                    className="meta-label"
                    style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}
                  >
                    Banner Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    className="input-box"
                    style={{
                      backgroundColor: '#FAF8F5',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      color: 'var(--color-charcoal)',
                    }}
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Styled Terracotta Toggle for Featured on Homepage Carousel */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'rgba(200, 75, 49, 0.05)',
                  border: '1px solid rgba(200, 75, 49, 0.25)',
                  borderRadius: '14px',
                }}
              >
                <input
                  type="checkbox"
                  id="create-event-featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    accentColor: 'var(--color-terracotta)',
                    cursor: 'pointer',
                  }}
                />
                <label
                  htmlFor="create-event-featured"
                  style={{ cursor: 'pointer', flex: 1, userSelect: 'none' }}
                >
                  <span
                    className="meta-label"
                    style={{
                      display: 'block',
                      color: 'var(--color-terracotta)',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      marginBottom: '0.2rem',
                    }}
                  >
                    ★ Featured on Homepage Carousel / Promo Ad
                  </span>
                  <span
                    className="meta-text-sm"
                    style={{
                      display: 'block',
                      color: 'var(--color-paper-muted)',
                      textTransform: 'none',
                      letterSpacing: 'normal',
                      fontSize: '0.75rem',
                    }}
                  >
                    Highlight this event in the premier homepage hero banner carousel for maximum attendee visibility.
                  </span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    className="meta-label"
                    style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}
                  >
                    Start Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="input-box"
                    style={{
                      backgroundColor: '#FAF8F5',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      color: 'var(--color-charcoal)',
                    }}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    className="meta-label"
                    style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}
                  >
                    End Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="input-box"
                    style={{
                      backgroundColor: '#FAF8F5',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      color: 'var(--color-charcoal)',
                    }}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Venue Sub-form */}
              <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '1rem' }}>
                <span
                  className="meta-label"
                  style={{ color: 'var(--color-terracotta)', display: 'block', marginBottom: '0.75rem' }}
                >
                  VENUE CONFIGURATION
                </span>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <label
                      className="meta-text-sm"
                      style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}
                    >
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HITEX Exhibition Centre"
                      className="input-box"
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        color: 'var(--color-charcoal)',
                      }}
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="meta-text-sm"
                      style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}
                    >
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Hyderabad"
                      className="input-box"
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        color: 'var(--color-charcoal)',
                      }}
                      value={venueCity}
                      onChange={(e) => setVenueCity(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      className="meta-text-sm"
                      style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}
                    >
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Trade Fair Office, IZZAT Nagar"
                      className="input-box"
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        color: 'var(--color-charcoal)',
                      }}
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="meta-text-sm"
                      style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}
                    >
                      Capacity *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="5000"
                      className="input-box"
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        color: 'var(--color-charcoal)',
                      }}
                      value={venueCapacity}
                      onChange={(e) => setVenueCapacity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Tier Sub-form */}
              <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '1rem' }}>
                <span
                  className="meta-label"
                  style={{ color: 'var(--color-terracotta)', display: 'block', marginBottom: '0.75rem' }}
                >
                  PRIMARY TICKET TIER
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      className="meta-text-sm"
                      style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}
                    >
                      Tier Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. General Admission"
                      className="input-box"
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        color: 'var(--color-charcoal)',
                      }}
                      value={tierName}
                      onChange={(e) => setTierName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="meta-text-sm"
                      style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}
                    >
                      Price (INR) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="999"
                      className="input-box"
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        color: 'var(--color-charcoal)',
                      }}
                      value={tierPriceInr}
                      onChange={(e) => setTierPriceInr(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="meta-text-sm"
                      style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}
                    >
                      Seats *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="1000"
                      className="input-box"
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        color: 'var(--color-charcoal)',
                      }}
                      value={tierCapacity}
                      onChange={(e) => setTierCapacity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, borderRadius: '9999px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-cyan btn-pill"
                  style={{ flex: 2, fontWeight: 700 }}
                >
                  {isSubmitting ? 'Creating Event...' : 'Create & Publish Manifest →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Event */}
      {showEditModal && editingEvent && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 20, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
              width: '100%',
              maxWidth: '580px',
              padding: 'clamp(1.5rem, 3.5vw, 2.5rem)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ color: 'var(--color-charcoal)', margin: 0, fontSize: '1.5rem' }}>
                Edit Event Details
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-paper-muted)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveEditEvent}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}>
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{
                    backgroundColor: '#FAF8F5',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '10px',
                    color: 'var(--color-charcoal)',
                  }}
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>

              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}>
                  Category
                </label>
                <select
                  className="input-box"
                  style={{
                    backgroundColor: '#FAF8F5',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '10px',
                    color: 'var(--color-charcoal)',
                  }}
                  value={editingEvent.category}
                  onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                >
                  <option value="Music">Music</option>
                  <option value="Conclave">Conclave</option>
                  <option value="Classical">Classical</option>
                  <option value="Comedy">Comedy</option>
                </select>
              </div>

              <div>
                <label className="meta-label" style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)' }}>
                  Description
                </label>
                <textarea
                  rows={4}
                  className="input-box"
                  style={{
                    fontFamily: 'var(--font-sans-stack)',
                    backgroundColor: '#FAF8F5',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '10px',
                    color: 'var(--color-charcoal)',
                  }}
                  value={editingEvent.description}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, description: e.target.value })
                  }
                />
              </div>

              {/* Styled Terracotta Toggle for Homepage Featured */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'rgba(200, 75, 49, 0.05)',
                  border: '1px solid rgba(200, 75, 49, 0.25)',
                  borderRadius: '14px',
                }}
              >
                <input
                  type="checkbox"
                  id="edit-event-featured"
                  checked={Boolean(editingEvent.is_featured)}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, is_featured: e.target.checked })
                  }
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    accentColor: 'var(--color-terracotta)',
                    cursor: 'pointer',
                  }}
                />
                <label
                  htmlFor="edit-event-featured"
                  style={{ cursor: 'pointer', flex: 1, userSelect: 'none' }}
                >
                  <span
                    className="meta-label"
                    style={{
                      display: 'block',
                      color: 'var(--color-terracotta)',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      marginBottom: '0.2rem',
                    }}
                  >
                    ★ Featured on Homepage Carousel / Promo Ad
                  </span>
                  <span
                    className="meta-text-sm"
                    style={{
                      display: 'block',
                      color: 'var(--color-paper-muted)',
                      textTransform: 'none',
                      letterSpacing: 'normal',
                      fontSize: '0.75rem',
                    }}
                  >
                    Highlight this event in the premier homepage hero banner carousel for maximum attendee visibility.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, borderRadius: '9999px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-cyan btn-pill"
                  style={{ flex: 2, fontWeight: 700 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

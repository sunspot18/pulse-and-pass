'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { SEEDED_LINEUP } from '../../../data/seeded-events';
import { apiRequest } from '../../../lib/api';
import { useToast } from '../../../components/Toast';
import { PaymentModal } from '../../../components/PaymentModal';

interface TicketTierData {
  id: string;
  name: string;
  description?: string;
  price_paise: number;
  capacity: number;
  sold: number;
  available: number;
}

interface EventDetailData {
  id: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  doors_open_time?: string | null;
  age_restriction?: string | null;
  banner_url?: string | null;
  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
    state?: string;
    capacity: number;
  };
  tiers: TicketTierData[];
}

interface AttendeeFormInput {
  name: string;
  email: string;
  phone: string;
}

export default function EventDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const { showToast } = useToast();

  // Next.js 15 Dynamic Route Params extraction (synchronous useParams with promise fallback)
  const routeId = routeParams?.id
    ? (Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id)
    : '';

  const [resolvedParamId, setResolvedParamId] = useState<string>(routeId || '');

  useEffect(() => {
    let active = true;
    if (routeId) {
      setResolvedParamId(routeId);
      return;
    }
    if (params) {
      if (typeof (params as any)?.then === 'function') {
        params
          .then((p) => {
            if (active && p?.id) setResolvedParamId(p.id);
          })
          .catch(() => {});
      } else {
        const syncId = (params as unknown as { id?: string })?.id;
        if (active && syncId) setResolvedParamId(syncId);
      }
    }
    return () => {
      active = false;
    };
  }, [params, routeId]);

  const eventId = routeId || resolvedParamId;

  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Booking Flow States
  const [isHolding, setIsHolding] = useState(false);
  const [reservation, setReservation] = useState<{ id: string; expires_at: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [attendees, setAttendees] = useState<AttendeeFormInput[]>([
    { name: '', email: '', phone: '' },
  ]);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    totalAmountPaise: number;
    ticketCount: number;
    tickets?: unknown[];
  } | null>(null);

  // Auto-fill primary attendee if signed in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setAttendees((prev) => {
            const next = [...prev];
            if (next[0] && (!next[0].name || !next[0].email)) {
              next[0] = {
                name: u.name || '',
                email: u.email || '',
                phone: u.phone || '9876543210',
              };
            }
            return next;
          });
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Load Event Dossier
  useEffect(() => {
    let isMounted = true;
    async function fetchEvent() {
      setIsLoading(true);

      const targetId = eventId || 'e0000001-0000-0000-0000-000000000001';

      try {
        const res = await apiRequest<any>(`/events/${targetId}`);
        const rawEvent =
          res && typeof res === 'object'
            ? res.event || res.data || (res.id && res.title ? res : null)
            : null;

        if (isMounted && rawEvent && rawEvent.id) {
          // Ensure tiers are present and populated with availability
          const rawTiers = Array.isArray(rawEvent.tiers) ? rawEvent.tiers : [];
          const tiers: TicketTierData[] =
            rawTiers.length > 0
              ? rawTiers.map((t: any) => ({
                  id: String(t.id),
                  name: String(t.name || 'General Admission'),
                  description: t.description || undefined,
                  price_paise: Number(t.price_paise) || 99900,
                  capacity: Number(t.capacity) || 500,
                  sold: Number(t.sold) || 0,
                  available: Number(t.available ?? (Number(t.capacity) - Number(t.sold))) || 500,
                }))
              : [
                  {
                    id: 'tier-ga',
                    name: 'General Admission',
                    description: 'Full standing floor entry and main stage access.',
                    price_paise: Number(rawEvent.min_price_paise) || 99900,
                    capacity: 500,
                    sold: 120,
                    available: 380,
                  },
                  {
                    id: 'tier-vip',
                    name: 'VIP All-Access Pass',
                    description: 'Express turnstile lane and elevated viewing lounge.',
                    price_paise: (Number(rawEvent.min_price_paise) || 99900) + 150000,
                    capacity: 100,
                    sold: 45,
                    available: 55,
                  },
                ];

          const fullEvent: EventDetailData = {
            id: rawEvent.id,
            title: rawEvent.title,
            description: rawEvent.description || 'Curated box-office experience.',
            category: rawEvent.category || 'General',
            start_time: rawEvent.start_time || new Date().toISOString(),
            end_time: rawEvent.end_time || new Date(Date.now() + 3600000 * 4).toISOString(),
            doors_open_time: rawEvent.doors_open_time,
            age_restriction: rawEvent.age_restriction,
            banner_url: rawEvent.banner_url,
            venue: rawEvent.venue || {
              id: 'v1',
              name: 'Main Arena',
              address: 'City Center',
              city: 'Hyderabad',
              capacity: 10000,
            },
            tiers,
          };

          setEvent(fullEvent);
          if (fullEvent.tiers[0]) {
            setSelectedTierId(fullEvent.tiers[0].id);
          }
          return;
        }

        throw new Error('Event manifest empty');
      } catch {
        // Fallback to seeded lineup fixture if backend event not found or offline
        const seededMatch =
          SEEDED_LINEUP.find((e) => e.id === targetId) ||
          SEEDED_LINEUP.find((e) => e.slug === targetId) ||
          SEEDED_LINEUP[0];

        if (isMounted && seededMatch) {
          const fallbackDetail: EventDetailData = {
            id: seededMatch.id,
            title: seededMatch.title,
            description:
              seededMatch.description ||
              'Join us for an unforgettable live experience at premier metropolitan arenas.',
            category: seededMatch.category,
            start_time: '2026-10-24T18:00:00Z',
            end_time: '2026-10-24T23:00:00Z',
            doors_open_time: '2026-10-24T17:00:00Z',
            age_restriction: '16+ with photo ID',
            banner_url: null,
            venue: {
              id: 'v1',
              name: seededMatch.venueName,
              address: 'Trade Fair Grounds, IZZAT Nagar',
              city: seededMatch.cityName,
              capacity: 12000,
            },
            tiers: [
              {
                id: 't-gen',
                name: 'General Admission',
                description: 'Full standing floor entry and main stage access.',
                price_paise: seededMatch.minPrice * 100,
                capacity: 500,
                sold: 120,
                available: 380,
              },
              {
                id: 't-vip',
                name: 'VIP All-Access Pass',
                description:
                  'Express turnstile lane, elevated viewing lounge, and inclusive hospitality.',
                price_paise: (seededMatch.minPrice + 1500) * 100,
                capacity: 100,
                sold: 45,
                available: 55,
              },
              {
                id: 't-pit',
                name: 'Fan Pit Pass',
                description:
                  'Direct front-of-stage standing area with priority gate clearance.',
                price_paise: (seededMatch.minPrice + 3000) * 100,
                capacity: 50,
                sold: 20,
                available: 30,
              },
            ],
          };
          setEvent(fallbackDetail);
          if (fallbackDetail.tiers[0]) {
            setSelectedTierId(fallbackDetail.tiers[0].id);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchEvent();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Adjust attendee input fields count to match quantity
  useEffect(() => {
    setAttendees((prev) => {
      const next = [...prev];
      while (next.length < quantity) {
        next.push({ name: '', email: '', phone: '' });
      }
      return next.slice(0, quantity);
    });
  }, [quantity]);

  // Countdown timer for atomic hold
  useEffect(() => {
    if (!reservation || (!showCheckoutModal && !showPaymentModal)) return;

    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(reservation.expires_at).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setShowCheckoutModal(false);
        setShowPaymentModal(false);
        setReservation(null);
        showToast('Reservation hold expired. Please select tickets again.', 'warning');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation, showCheckoutModal, showPaymentModal, showToast]);

  const selectedTier = event?.tiers.find((t) => t.id === selectedTierId) || event?.tiers[0];

  // Initiate Hold
  const handleInitiateHold = async () => {
    if (!selectedTier) {
      showToast('Please choose an admission tier', 'error');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      showToast('Please sign in to reserve your ticket pass', 'info');
      router.push('/login');
      return;
    }

    setIsHolding(true);
    try {
      const res = await apiRequest<{
        message: string;
        reservation: { id: string; expires_at: string };
      }>('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          tier_id: selectedTier.id,
          quantity,
        }),
      });

      setReservation(res.reservation);
      setTimeLeft(300);
      setShowCheckoutModal(true);
      showToast('Atomic tier hold created (5-minute window)', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // Offline / Demo fallback hold simulation
      if (msg.includes('Failed to fetch') || msg.includes('404')) {
        const simulatedHold = {
          id: 'sim-hold-' + Math.random().toString(36).slice(2, 9),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
        setReservation(simulatedHold);
        setTimeLeft(300);
        setShowCheckoutModal(true);
        showToast('Local demo hold locked for 5 minutes', 'info');
      } else {
        showToast(msg || 'Could not place reservation hold', 'error');
      }
    } finally {
      setIsHolding(false);
    }
  };

  // Proceed from Attendee Roster to Payment Simulation Modal
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    // Validate inputs
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a || !a.name.trim() || !a.email.trim() || !a.phone.trim()) {
        showToast(`Please complete attendee #${i + 1} information`, 'warning');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(a.phone.trim())) {
        showToast(`Attendee #${i + 1} requires a valid 10-digit Indian phone number`, 'warning');
        return;
      }
    }

    setShowCheckoutModal(false);
    setShowPaymentModal(true);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '60vh', padding: '5rem 0', textAlign: 'center' }}>
          <div className="container">
            <span className="meta-label">LOADING DOSSIER...</span>
            <h2 style={{ marginTop: '0.5rem' }}>Fetching Event Manifest</h2>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '60vh', padding: '5rem 0', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ color: 'var(--color-void)' }}>Event Manifest Not Found</h2>
            <p className="body-copy" style={{ margin: '1rem auto' }}>
              The requested event could not be retrieved from the box office registry.
            </p>
            <Link href="/events" className="btn btn-cyan btn-sm">
              ← BACK TO LINEUP
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const startDate = new Date(event.start_time);
  const formattedDate = startDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const catKey = (event.category || '').toLowerCase();
  const eventImageUrl =
    event.banner_url ||
    (catKey === 'music'
      ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85'
      : catKey === 'conclave'
        ? 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85'
        : catKey === 'classical'
          ? 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=85'
          : catKey === 'comedy'
            ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85'
            : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85');

  return (
    <>
      <Navbar />

      {/* Persistent 5-Minute Atomic Hold Banner if active */}
      {reservation && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid rgba(200, 75, 49, 0.25)',
            boxShadow: '0 4px 20px rgba(200, 75, 49, 0.08)',
            padding: '0.75rem 1rem',
            position: 'sticky',
            top: '68px',
            zIndex: 45,
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: 'rgba(200, 75, 49, 0.1)',
                  color: 'var(--color-terracotta)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                ⏱️ ATOMIC TIER HOLD ACTIVE
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>
                Your pass allocation is temporarily reserved in PostgreSQL inventory. Complete checkout before timer expires.
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono-stack)',
                fontWeight: 800,
                fontSize: '1.05rem',
                backgroundColor: 'var(--color-terracotta)',
                color: '#FFFFFF',
                padding: '0.25rem 0.85rem',
                borderRadius: '9999px',
                letterSpacing: '0.05em',
              }}
            >
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      )}

      <main style={{ minHeight: 'calc(100vh - 160px)', padding: '2.5rem 0 5rem' }}>
        <div className="container">
          {/* Breadcrumb / Return */}
          <div style={{ marginBottom: '2rem' }}>
            <Link
              href="/#lineup"
              style={{
                color: 'var(--color-paper-muted)',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              }}
            >
              ← RETURN TO DISCOVERY FEED
            </Link>
          </div>

          {/* High-Impact Split-Screen Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '2.5rem',
              alignItems: 'start',
            }}
          >
            {/* LEFT COLUMN: Event Artwork, Metadata & Venue Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Artwork Frame */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '360px',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-surface-warm)',
                  }}
                >
                  <img
                    src={eventImageUrl}
                    alt={event.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(20, 20, 20, 0.05) 0%, rgba(20, 20, 20, 0.65) 100%)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '1.5rem',
                      left: '1.5rem',
                      right: '1.5rem',
                      color: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        className="badge-pill badge-terracotta"
                        style={{ backdropFilter: 'blur(8px)', fontSize: '0.75rem' }}
                      >
                        {event.category.toUpperCase()}
                      </span>
                      {event.age_restriction && (
                        <span
                          className="badge-pill"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            color: '#FFFFFF',
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            backdropFilter: 'blur(8px)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {event.age_restriction}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: 'var(--color-charcoal)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.3rem 0.75rem',
                        borderRadius: '9999px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      BOX OFFICE OFFICIAL
                    </span>
                  </div>
                </div>

                {/* Event Dossier Text */}
                <div style={{ padding: '2rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-terracotta)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    OFFICIAL DOSSIER • {event.category}
                  </div>

                  <h1
                    style={{
                      fontSize: 'clamp(1.85rem, 3vw, 2.45rem)',
                      fontWeight: 800,
                      lineHeight: 1.15,
                      color: 'var(--color-charcoal)',
                      margin: '0 0 1rem 0',
                    }}
                  >
                    {event.title}
                  </h1>

                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--color-paper-80)',
                      lineHeight: 1.65,
                      margin: '0 0 1.75rem 0',
                    }}
                  >
                    {event.description}
                  </p>

                  {/* Date & Venue Strip */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '1rem',
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                      paddingTop: '1.25rem',
                    }}
                  >
                    <div>
                      <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                        CALENDAR DATE
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem', color: 'var(--color-charcoal)' }}>
                        {formattedDate}
                      </div>
                      <div className="meta-text-sm" style={{ color: 'var(--color-terracotta)', marginTop: '0.1rem' }}>
                        DOORS: {event.doors_open_time ? new Date(event.doors_open_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '18:00'} IST
                      </div>
                    </div>

                    <div>
                      <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                        VENUE &amp; CITY
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem', color: 'var(--color-charcoal)' }}>
                        {event.venue.name}
                      </div>
                      <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.1rem' }}>
                        {event.venue.address || event.venue.city}
                      </div>
                    </div>

                    <div>
                      <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                        ADMISSION CAPACITY
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem', color: 'var(--color-charcoal)' }}>
                        {event.venue.capacity.toLocaleString('en-IN')} Seats
                      </div>
                      <div className="meta-text-sm" style={{ color: 'var(--color-emerald)', marginTop: '0.1rem' }}>
                        ● DIGITAL TURNSTILE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Admission Tiers & Pass Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-terracotta)',
                    marginBottom: '0.35rem',
                  }}
                >
                  STEP 1 OF 2 • PASS ALLOCATION
                </div>
                <h2
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    color: 'var(--color-charcoal)',
                  }}
                >
                  Select Your Admission Tier
                </h2>
              </div>

              {/* Tiers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {event.tiers.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  const isSoldOut = tier.available <= 0;
                  const priceInr = Math.round(tier.price_paise / 100);
                  const capacityPct = Math.round(((tier.capacity - tier.available) / tier.capacity) * 100);

                  return (
                    <div
                      key={tier.id}
                      onClick={() => !isSoldOut && setSelectedTierId(tier.id)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: isSelected
                          ? '2px solid var(--color-terracotta)'
                          : '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '18px',
                        boxShadow: isSelected
                          ? '0 8px 30px rgba(200, 75, 49, 0.12)'
                          : '0 4px 16px rgba(0, 0, 0, 0.03)',
                        padding: '1.5rem',
                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                        opacity: isSoldOut ? 0.6 : 1,
                        position: 'relative',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-charcoal)' }}>
                              {tier.name}
                            </h3>
                            {isSelected && (
                              <span
                                style={{
                                  backgroundColor: 'rgba(200, 75, 49, 0.1)',
                                  color: 'var(--color-terracotta)',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '9999px',
                                }}
                              >
                                SELECTED
                              </span>
                            )}
                          </div>
                          <span
                            className="meta-text-sm"
                            style={{
                              color: isSelected ? 'var(--color-terracotta)' : 'var(--color-paper-muted)',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          >
                            {isSelected ? 'Ready to allocate' : 'Click to select pass'}
                          </span>
                        </div>

                        {isSoldOut ? (
                          <span className="stamp stamp-void">SOLD OUT</span>
                        ) : (
                          <div style={{ textAlign: 'right' }}>
                            <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', fontSize: '0.7rem' }}>
                              PASS PRICE
                            </div>
                            <span
                              style={{
                                fontSize: '1.45rem',
                                fontWeight: 800,
                                color: 'var(--color-charcoal)',
                                fontFamily: 'var(--font-mono-stack)',
                              }}
                            >
                              ₹{priceInr.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>

                      {tier.description && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-paper-80)',
                            lineHeight: 1.5,
                            margin: '0.5rem 0 1rem 0',
                          }}
                        >
                          {tier.description}
                        </p>
                      )}

                      {/* Perks checklist */}
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: '0 0 1rem 0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          fontSize: '0.8125rem',
                          color: 'var(--color-charcoal)',
                        }}
                      >
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--color-terracotta)', fontWeight: 800 }}>✓</span>
                          <span>Official turnstile admission with cryptographic QR pass</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--color-terracotta)', fontWeight: 800 }}>✓</span>
                          <span>5-minute atomic lock guarantee during reservation</span>
                        </li>
                      </ul>

                      {/* Capacity progress */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.3rem',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono-stack)',
                            color: 'var(--color-paper-muted)',
                          }}
                        >
                          <span>CAPACITY RESERVED</span>
                          <span style={{ fontWeight: 700 }}>
                            {tier.available} / {tier.capacity} REMAINING
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '5px',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, capacityPct)}%`,
                              height: '100%',
                              backgroundColor: 'var(--color-terracotta)',
                              borderRadius: '9999px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ready to Reserve & Hold Floating Action Bar */}
              {selectedTier && selectedTier.available > 0 && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(200, 75, 49, 0.3)',
                    borderRadius: '20px',
                    boxShadow: '0 12px 36px rgba(200, 75, 49, 0.1)',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--color-terracotta)',
                        }}
                      >
                        SUMMARY FOR CHECKOUT
                      </span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--color-charcoal)' }}>
                        {selectedTier.name} — ₹
                        {(Math.round(selectedTier.price_paise / 100) * quantity).toLocaleString('en-IN')}
                      </div>
                      <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.15rem' }}>
                        ₹{Math.round(selectedTier.price_paise / 100).toLocaleString('en-IN')} per pass × {quantity} attendee{quantity > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                        QTY:
                      </span>
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="btn btn-secondary btn-sm"
                        style={{
                          minHeight: '36px',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '1rem',
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono-stack)',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          minWidth: '28px',
                          textAlign: 'center',
                          color: 'var(--color-charcoal)',
                        }}
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= Math.min(10, selectedTier.available)}
                        onClick={() => setQuantity((q) => Math.min(10, selectedTier.available, q + 1))}
                        className="btn btn-secondary btn-sm"
                        style={{
                          minHeight: '36px',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '1rem',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isHolding}
                    onClick={handleInitiateHold}
                    className="btn btn-cyan btn-pill"
                    style={{
                      width: '100%',
                      minHeight: '50px',
                      padding: '0.9rem 2rem',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isHolding ? 'LOCKING INVENTORY...' : 'RESERVE & HOLD (5 MIN) →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Modal with Atomic Hold Timer */}
      {showCheckoutModal && reservation && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 20, 0.6)',
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
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'clamp(1.5rem, 3.5vw, 2.5rem)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span
                  style={{
                    backgroundColor: 'rgba(200, 75, 49, 0.1)',
                    color: 'var(--color-terracotta)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                  }}
                >
                  ATOMIC HOLD ACTIVE
                </span>
                <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: 'var(--color-charcoal)' }}>
                  Attendee Roster &amp; Checkout
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  HOLD EXPIRES IN
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-mono-stack)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--color-terracotta)',
                  }}
                >
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            <p
              className="meta-text-sm"
              style={{ color: 'var(--color-paper-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}
            >
              Your seats are temporarily allocated and locked in PostgreSQL to prevent overbooking.
              Enter attendee details for each gate pass:
            </p>

            <form
              onSubmit={handleProceedToPayment}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              {attendees.map((attendee, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--color-surface-warm)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      color: 'var(--color-terracotta)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    PASS HOLDER #{idx + 1} ({selectedTier?.name})
                  </span>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <label
                        className="meta-text-sm"
                        style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)', fontWeight: 600 }}
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rishika Deshmukh"
                        className="input-box"
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          color: 'var(--color-charcoal)',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '10px',
                        }}
                        value={attendee.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttendees((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, name: val } : a)),
                          );
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="meta-text-sm"
                        style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)', fontWeight: 600 }}
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="attendee@pulsepass.dev"
                        className="input-box"
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          color: 'var(--color-charcoal)',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '10px',
                        }}
                        value={attendee.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttendees((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, email: val } : a)),
                          );
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label
                        className="meta-text-sm"
                        style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--color-charcoal)', fontWeight: 600 }}
                      >
                        Indian Mobile (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="^[6-9]\d{9}$"
                        placeholder="9876543210"
                        className="input-box"
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          color: 'var(--color-charcoal)',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '10px',
                        }}
                        value={attendee.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttendees((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, phone: val } : a)),
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Payment Summary */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                  paddingTop: '1rem',
                  marginTop: '0.5rem',
                }}
              >
                <div>
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                    PAYMENT GATEWAY
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-charcoal)' }}>
                    Multi-Rail Simulation (UPI / Card / 1-Click)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                    BASE AMOUNT
                  </div>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono-stack)',
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    ₹
                    {(selectedTier
                      ? Math.round(selectedTier.price_paise / 100) * quantity
                      : 0
                    ).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, borderRadius: '9999px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn btn-cyan btn-pill"
                  style={{ flex: 2, padding: '0.75rem 1.5rem', fontWeight: 700 }}
                >
                  PROCEED TO PAYMENT SIMULATOR →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Simulation Modal */}
      {showPaymentModal && reservation && selectedTier && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          event={{
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            doors_open_time: event.doors_open_time,
            venue: event.venue,
          }}
          tier={selectedTier}
          quantity={quantity}
          reservation={reservation}
          timeLeft={timeLeft}
          attendees={attendees}
          onBackToAttendees={() => {
            setShowPaymentModal(false);
            setShowCheckoutModal(true);
          }}
          onOrderSuccess={(order) => {
            setConfirmedOrder({
              orderNumber: order.orderNumber,
              totalAmountPaise: order.totalAmountPaise,
              ticketCount: order.ticketCount,
              tickets: order.tickets,
            });
          }}
        />
      )}

      {/* Booking Confirmation View Modal */}
      {confirmedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 20, 20, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
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
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              width: '100%',
              maxWidth: '560px',
              padding: 'clamp(1.5rem, 3.5vw, 2.5rem)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎟️</div>
            <span
              style={{
                backgroundColor: 'rgba(200, 75, 49, 0.1)',
                color: 'var(--color-terracotta)',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.75rem',
                borderRadius: '9999px',
              }}
            >
              TRANSACTION CONFIRMED
            </span>

            <h2 style={{ fontSize: '1.75rem', marginTop: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-charcoal)' }}>
              Your Passes Are Issued!
            </h2>

            <p style={{ margin: '0 auto 1.5rem', fontSize: '0.95rem', color: 'var(--color-paper-80)' }}>
              Order reference{' '}
              <strong style={{ color: 'var(--color-charcoal)' }}>{confirmedOrder.orderNumber}</strong>{' '}
              has been cryptographically signed with HMAC-SHA256 for instant gate verification.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-surface-warm)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  EVENT
                </span>
                <div style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>{event.title}</div>
                <div className="meta-text-sm" style={{ color: 'var(--color-terracotta)', fontWeight: 600 }}>
                  {confirmedOrder.ticketCount} × {selectedTier?.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  PAID
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-mono-stack)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--color-charcoal)',
                  }}
                >
                  ₹{Math.round(confirmedOrder.totalAmountPaise / 100).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Link
                href="/tickets"
                className="btn btn-cyan btn-sm btn-pill"
                style={{ textDecoration: 'none', padding: '0.6rem 1.5rem', fontWeight: 700 }}
              >
                VIEW IN PASS WALLET →
              </Link>
              <button
                type="button"
                onClick={() => setConfirmedOrder(null)}
                className="btn btn-ghost btn-sm"
                style={{ borderRadius: '9999px' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

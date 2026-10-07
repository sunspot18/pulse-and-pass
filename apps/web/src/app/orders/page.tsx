'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { apiRequest, API_BASE_URL } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface WalletTicket {
  id: string;
  ticketCode: string;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  tierName: string;
  pricePaise: number;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  venueName: string;
  venueCity: string;
  eventDate: string;
  dayNumber: string;
  monthYear: string;
  gateTime: string;
  orderNumber: string;
  qrCodeDataUrl?: string;
}

const SEEDED_WALLET_TICKETS: WalletTicket[] = [
  {
    id: '88888888-8888-8888-8888-888888888881',
    ticketCode: 'PNP-TK-8901-A1B2C3D4',
    status: 'valid',
    tierName: 'VIP All-Access Pass',
    pricePaise: 249900,
    attendeeName: 'Rishika Deshmukh',
    attendeeEmail: 'rishika@pulsepass.dev',
    eventTitle: 'Echoes of Deccan: Fusion Music Festival 2026',
    venueName: 'HITEX Exhibition Centre',
    venueCity: 'Hyderabad',
    eventDate: 'Saturday, 24 Oct 2026',
    dayNumber: '24',
    monthYear: 'OCT 2026',
    gateTime: '18:00 IST',
    orderNumber: 'PNP-2026-HYD8901',
  },
  {
    id: '88888888-8888-8888-8888-888888888882',
    ticketCode: 'PNP-TK-8901-E5F6G7H8',
    status: 'valid',
    tierName: 'VIP All-Access Pass',
    pricePaise: 249900,
    attendeeName: 'Aarav Deshmukh',
    attendeeEmail: 'aarav.deshmukh@pulsepass.dev',
    eventTitle: 'Echoes of Deccan: Fusion Music Festival 2026',
    venueName: 'HITEX Exhibition Centre',
    venueCity: 'Hyderabad',
    eventDate: 'Saturday, 24 Oct 2026',
    dayNumber: '24',
    monthYear: 'OCT 2026',
    gateTime: '18:00 IST',
    orderNumber: 'PNP-2026-HYD8901',
  },
];

interface ApiTicketItem {
  id: string;
  ticket_code: string;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  tier_name?: string;
  unit_price_paise?: number;
  attendee_name?: string;
  attendee_email?: string;
  event_title?: string;
  venue_name?: string;
  venue_city?: string;
  event_start_time?: string;
  doors_open_time?: string;
  order_id?: string;
  qr_code_data_url?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<WalletTicket[]>(SEEDED_WALLET_TICKETS);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'passes' | 'orders'>('passes');
  const [authToken, setAuthToken] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token') || '';
      setAuthToken(token);

      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          setCurrentUser({ name: 'Rishika Deshmukh', email: 'rishika@pulsepass.dev' });
        }
      } else {
        setCurrentUser({ name: 'Rishika Deshmukh', email: 'rishika@pulsepass.dev' });
      }

      // Fetch live wallet from backend if token exists
      if (token) {
        apiRequest<{ active: ApiTicketItem[]; past: ApiTicketItem[]; total: number }>(
          '/tickets/wallet',
        )
          .then((data) => {
            const allTickets = [...(data.active || []), ...(data.past || [])];
            if (allTickets.length > 0) {
              const mapped: WalletTicket[] = allTickets.map((t: ApiTicketItem) => {
                const eventDateObj = new Date(t.event_start_time || Date.now());
                return {
                  id: t.id,
                  ticketCode: t.ticket_code,
                  status: t.status,
                  tierName: t.tier_name || 'General Admission',
                  pricePaise: t.unit_price_paise || 99900,
                  attendeeName: t.attendee_name || 'Pass Holder',
                  attendeeEmail: t.attendee_email || 'attendee@pulsepass.dev',
                  eventTitle: t.event_title || 'Pulse & Pass Event',
                  venueName: t.venue_name || 'HITEX Exhibition Centre',
                  venueCity: t.venue_city || 'Hyderabad',
                  eventDate: eventDateObj.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                  dayNumber: eventDateObj.getDate().toString().padStart(2, '0'),
                  monthYear: eventDateObj
                    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    .toUpperCase(),
                  gateTime: t.doors_open_time
                    ? new Date(t.doors_open_time).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      }) + ' IST'
                    : '18:00 IST',
                  orderNumber: `ORD-${t.order_id?.slice(0, 8) || '2026-001'}`,
                  qrCodeDataUrl: t.qr_code_data_url,
                };
              });
              setTickets(mapped);
            }
          })
          .catch((err) => {
            // Keep seeded fallback tickets and notify user
            showToast(`Using offline wallet cache: ${err.message}`, 'info');
          });
      }
    }
  }, [showToast]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'pulsepass_token=; path=/; max-age=0;';
    }
    setCurrentUser(null);
    showToast('Signed out of wallet session', 'info');
    router.push('/');
  };

  return (
    <>
      <Navbar />

      <main style={{ minHeight: 'calc(100vh - 160px)', padding: '2.5rem 0 4rem' }}>
        <div className="container">
          {/* Header Bar */}
          <div
            style={{
              borderBottom: '2px solid var(--color-border)',
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
                  className="badge-pill"
                  style={{ color: 'var(--color-cyan)', borderColor: 'var(--color-cyan)' }}
                >
                  ACTIVE PASS WALLET
                </span>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  {currentUser?.email || 'rishika@pulsepass.dev'}
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>My Tickets &amp; Passes</h1>
              <p className="body-copy" style={{ marginTop: '0.5rem', fontSize: '1rem' }}>
                Signed in as{' '}
                <strong style={{ color: 'var(--color-paper)' }}>
                  {currentUser?.name || 'Rishika Deshmukh'}
                </strong>
                . Present your QR code or printable pass manifest at the venue gates for instant
                scan.
              </p>
            </div>

            <div
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Link
                href="/events"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                + DISCOVER MORE SHOWS
              </Link>
              {currentUser?.role === 'organizer' && (
                <Link
                  href="/organizer"
                  className="btn btn-cyan btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  ORGANIZER CONSOLE
                </Link>
              )}
              {currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="btn btn-cyan btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  ADMIN PANEL
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-void)' }}
              >
                SIGN OUT
              </button>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(244, 241, 234, 0.1)',
              paddingBottom: '1rem',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('passes')}
              className={`btn btn-sm ${activeTab === 'passes' ? 'btn-cyan' : 'btn-ghost'}`}
            >
              ACTIVE PASSES ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`btn btn-sm ${activeTab === 'orders' ? 'btn-cyan' : 'btn-ghost'}`}
            >
              ORDER HISTORY (1)
            </button>
          </div>

          {/* Tab 1: Active Passes */}
          {activeTab === 'passes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {tickets.map((t) => {
                const printUrl = `${API_BASE_URL}/tickets/${t.id}/print${authToken ? `?token=${authToken}` : ''}`;

                return (
                  <div key={t.id} className="ticket-wrapper">
                    <div className="ticket-row" style={{ minHeight: '220px' }}>
                      {/* Main Ticket Body */}
                      <div className="ticket-body">
                        <div>
                          {/* Meta Top Line */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span
                                className="badge-pill"
                                style={{
                                  color: 'var(--color-amber)',
                                  borderColor: 'var(--color-amber)',
                                }}
                              >
                                {t.tierName.toUpperCase()}
                              </span>
                              <span className="meta-text-sm">GATE ENTRY: {t.gateTime}</span>
                            </div>

                            <div className="stamp stamp-onsale" style={{ position: 'static' }}>
                              {t.status.toUpperCase()}
                            </div>
                          </div>

                          {/* Title */}
                          <h2
                            style={{
                              fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
                              marginBottom: '0.5rem',
                            }}
                          >
                            {t.eventTitle}
                          </h2>

                          <p className="meta-text" style={{ color: 'var(--color-paper-muted)' }}>
                            {t.venueName} • {t.venueCity}
                          </p>
                        </div>

                        {/* Attendee Details & Actions */}
                        <div
                          style={{
                            borderTop: '1px solid rgba(244, 241, 234, 0.1)',
                            paddingTop: '1rem',
                            marginTop: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <div
                              className="meta-text-sm"
                              style={{ color: 'var(--color-paper-muted)' }}
                            >
                              PASS HOLDER
                            </div>
                            <div
                              style={{
                                fontFamily: 'var(--font-sans-stack)',
                                fontWeight: 600,
                                fontSize: '1rem',
                              }}
                            >
                              {t.attendeeName}
                            </div>
                          </div>

                          <div>
                            <div
                              className="meta-text-sm"
                              style={{ color: 'var(--color-paper-muted)' }}
                            >
                              ORDER REF
                            </div>
                            <div className="meta-text" style={{ color: 'var(--color-paper)' }}>
                              {t.orderNumber}
                            </div>
                          </div>

                          <div>
                            <a
                              href={printUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ textDecoration: 'none' }}
                            >
                              📄 PRINT PASS (XML)
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Perforation Divider with Notches */}
                      <div className="ticket-perforation-v" />

                      {/* Detachable Stub */}
                      <div className="ticket-stub">
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-sans-stack)',
                              fontSize: '2.5rem',
                              fontWeight: 800,
                              lineHeight: 1,
                              color: 'var(--color-paper)',
                            }}
                          >
                            {t.dayNumber}
                          </div>
                          <div
                            className="meta-text-sm"
                            style={{ color: 'var(--color-paper-muted)', marginTop: '0.2rem' }}
                          >
                            {t.monthYear}
                          </div>
                        </div>

                        {/* Barcode / QR Placeholder */}
                        <div style={{ width: '100%', padding: '0.5rem 0' }}>
                          <div
                            style={{
                              height: '42px',
                              background:
                                'repeating-linear-gradient(90deg, #F4F1EA, #F4F1EA 2px, transparent 2px, transparent 4px, #F4F1EA 4px, #F4F1EA 7px, transparent 7px, transparent 9px)',
                              opacity: 0.85,
                            }}
                          />
                          <div
                            className="meta-text-sm"
                            style={{
                              fontSize: '0.65rem',
                              letterSpacing: '0.08em',
                              color: 'var(--color-paper-muted)',
                              marginTop: '0.4rem',
                              wordBreak: 'break-all',
                            }}
                          >
                            {t.ticketCode}
                          </div>
                        </div>

                        <div
                          className="meta-text-sm"
                          style={{ color: 'var(--color-cyan)', fontSize: '0.7rem' }}
                        >
                          ● ADMIT ONE
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Order History */}
          {activeTab === 'orders' && (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                padding: '2rem',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(244, 241, 234, 0.1)',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <span
                    className="badge-pill"
                    style={{ color: 'var(--color-cyan)', borderColor: 'var(--color-cyan)' }}
                  >
                    ORDER # PNP-2026-HYD8901
                  </span>
                  <div className="meta-text-sm" style={{ marginTop: '0.4rem' }}>
                    DATE: 05 OCT 2026 • METHOD: SIMULATED_UPI • REF: UPI-REF-20261005-9988
                  </div>
                </div>
                <div className="price-tag-lg">₹4,998</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(15, 16, 18, 0.5)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      Echoes of Deccan: Fusion Music Festival 2026
                    </div>
                    <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                      2 × VIP All-Access Pass (Rishika Deshmukh, Aarav Deshmukh)
                    </div>
                  </div>
                  <div className="price-tag">₹4,998</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

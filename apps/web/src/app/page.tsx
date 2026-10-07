'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TicketRow } from '../components/TicketRow';
import { PromoCarousel } from '../components/PromoCarousel';
import { SEEDED_LINEUP, type BoxOfficeEvent } from '../data/seeded-events';
import { apiRequest } from '../lib/api';
import { useToast } from '../components/Toast';

const CITIES = ['ALL', 'Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi'];
const CATEGORIES = ['ALL', 'Music', 'Conclave', 'Classical', 'Comedy'];

interface ApiEventTier {
  name: string;
  price_paise: number;
}

interface ApiEventItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  start_time: string;
  doors_open_time?: string | null;
  min_price_paise?: number;
  is_sold_out?: boolean;
  is_featured?: boolean;
  description?: string;
  banner_url?: string | null;
  venue?: {
    name?: string;
    city?: string;
  };
  tiers?: ApiEventTier[];
}

// Curated mosaic artworks for hero visual showcase
const HERO_MOSAIC_CARDS = [
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    title: 'Echoes of Deccan',
    subtitle: 'Fusion Music Fest',
    category: 'MUSIC',
    city: 'Hyderabad',
    date: '14 NOV',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    height: '260px',
  },
  {
    id: 'e0000011-0000-0000-0000-000000000011',
    title: 'Synthwave & Cyberpunk',
    subtitle: 'Midnight Acoustics',
    category: 'SYNTH',
    city: 'Mumbai',
    date: '21 NOV',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    height: '220px',
  },
  {
    id: 'e0000002-0000-0000-0000-000000000002',
    title: 'Full Stack Conclave',
    subtitle: 'Architecture & Systems',
    category: 'CONCLAVE',
    city: 'Bengaluru',
    date: '12 NOV',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
    height: '280px',
  },
  {
    id: 'e0000016-0000-0000-0000-000000000016',
    title: 'Capital Soundwave',
    subtitle: 'Warehouse Industrial',
    category: 'TECHNO',
    city: 'Delhi',
    date: '27 NOV',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80',
    height: '240px',
  },
];

export default function HomePage() {
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [events, setEvents] = useState<BoxOfficeEvent[]>(SEEDED_LINEUP);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K focuses the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        showToast('Search focused (⌘K)', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  // Fetch from backend with fallback
  useEffect(() => {
    let isCancelled = false;

    async function loadEvents() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCity !== 'ALL') queryParams.set('city', selectedCity);
        if (selectedCategory !== 'ALL') queryParams.set('category', selectedCategory);
        if (searchTerm.trim()) queryParams.set('search', searchTerm.trim());

        const queryString = queryParams.toString();
        const endpoint = `/events${queryString ? `?${queryString}` : ''}`;

        const res = await apiRequest<{ events: ApiEventItem[] }>(endpoint);

        if (!isCancelled && res.events && Array.isArray(res.events) && res.events.length > 0) {
          const mapped: BoxOfficeEvent[] = res.events.map((e: ApiEventItem) => {
            const startDate = new Date(e.start_time);
            return {
              id: e.id,
              title: e.title,
              slug: e.slug,
              category: e.category,
              dayNumber: startDate.getDate().toString().padStart(2, '0'),
              monthYear: startDate
                .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                .toUpperCase(),
              dayOfWeek: startDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
              venueName: e.venue?.name || 'Main Stage Arena',
              cityName: e.venue?.city || 'Hyderabad',
              gateTime: e.doors_open_time
                ? new Date(e.doors_open_time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }) + ' IST'
                : '18:00 IST',
              minPrice: e.min_price_paise ? Math.round(e.min_price_paise / 100) : 999,
              currency: 'INR',
              status: e.is_sold_out ? 'SOLD OUT' : 'ON SALE',
              serialCode: `PNP-${(e.venue?.city || 'IND').slice(0, 3).toUpperCase()}-${startDate.getDate()}`,
              description: e.description,
              is_featured: Boolean(e.is_featured),
              isHeadliner: Boolean(e.is_featured),
              tierSummary: e.tiers
                ?.map((t: ApiEventTier) => `${t.name} (₹${Math.round(t.price_paise / 100)})`)
                .join(' • '),
            };
          });

          // Headliner flag for featured event or first event if none flagged
          const hasHeadliner = mapped.some((m) => m.isHeadliner);
          if (!hasHeadliner && mapped[0]) mapped[0].isHeadliner = true;
          setEvents(mapped);
        } else if (!isCancelled && res.events?.length === 0) {
          setEvents([]);
        }
      } catch {
        // Fallback to seeded events filtered client-side for offline resilience
        if (!isCancelled) {
          let filtered = [...SEEDED_LINEUP];
          if (selectedCity !== 'ALL') {
            filtered = filtered.filter(
              (ev) => ev.cityName.toLowerCase() === selectedCity.toLowerCase(),
            );
          }
          if (selectedCategory !== 'ALL') {
            filtered = filtered.filter(
              (ev) => ev.category.toLowerCase() === selectedCategory.toLowerCase(),
            );
          }
          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(
              (ev) =>
                ev.title.toLowerCase().includes(q) ||
                (ev.description && ev.description.toLowerCase().includes(q)),
            );
          }
          setEvents(filtered);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadEvents();

    return () => {
      isCancelled = true;
    };
  }, [selectedCity, selectedCategory, searchTerm]);

  const handleCityChange = (city: string) => {
    startTransition(() => {
      setSelectedCity(city);
    });
  };

  const handleCategoryChange = (category: string) => {
    startTransition(() => {
      setSelectedCategory(category);
    });
  };

  const headliner = events.find((e) => e.isHeadliner) || events[0];
  const regularEvents = events.filter((e) => e.id !== headliner?.id);

  return (
    <>
      <Navbar />

      {/* Dynamic Homepage Hero Carousel */}
      <PromoCarousel />

      {/* Centerpiece Hero Section Inspired by Curated Editorial Galleries */}
      <section
        style={{
          paddingTop: 'clamp(2.5rem, 5vw, 4.5rem)',
          paddingBottom: 'clamp(2.5rem, 5vw, 4rem)',
          borderBottom: '1px solid rgba(20, 20, 20, 0.07)',
          backgroundColor: 'var(--color-ink)',
        }}
      >
        <div className="container">
          {/* Main Hero Header */}
          <div style={{ maxWidth: '880px', marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginBottom: '1rem',
              }}
            >
              <span className="badge-pill badge-terracotta">
                ● BOX OFFICE OPEN
              </span>
              <span
                className="section-header-kicker"
                style={{ margin: 0, fontSize: '0.75rem' }}
              >
                CURATED SEASON 2026-27
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)',
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem',
                color: 'var(--color-charcoal)',
              }}
            >
              DISCOVER LIVE EXPERIENCES AROUND YOU
            </h1>

            <p
              className="type-body-lg"
              style={{
                color: 'var(--color-paper-80)',
                maxWidth: '680px',
                fontSize: 'clamp(1rem, 1.4vw, 1.15rem)',
                lineHeight: 1.65,
                marginBottom: '2rem',
              }}
            >
              Handpicked concerts, cultural summits, and transcendent stage performances across
              India&apos;s premier metropolitan arenas. Guaranteed atomic tier reservations with
              instant cryptographic admission.
            </p>

            {/* Integrated Search Bar with Icon and ⌘K Hint */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '16px',
                padding: '0.4rem 0.6rem 0.4rem 1.25rem',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
                maxWidth: '640px',
                marginBottom: '1.75rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-paper-muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginRight: '0.75rem' }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>

              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by artist, festival, genre, or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-sans-stack)',
                  color: 'var(--color-charcoal)',
                  background: 'transparent',
                }}
                aria-label="Search events"
              />

              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-paper-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: '0.4rem 0.6rem',
                  }}
                >
                  ✕
                </button>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'var(--color-paper-muted)',
                    fontFamily: 'var(--font-mono-stack)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  ⌘K
                </span>
              )}
            </div>

            {/* City Filter Pills Styled as Rounded Chips */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <span
                className="meta-text-sm"
                style={{
                  marginRight: '0.5rem',
                  fontWeight: 700,
                  color: 'var(--color-charcoal)',
                }}
              >
                METRO:
              </span>
              {CITIES.map((city) => {
                const isActive = selectedCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCityChange(city)}
                    style={{
                      borderRadius: '9999px',
                      padding: '0.45rem 1.15rem',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? 'var(--color-terracotta)' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : 'var(--color-charcoal)',
                      border: isActive ? '1px solid var(--color-terracotta)' : '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: isActive
                        ? '0 4px 14px rgba(200, 75, 49, 0.3)'
                        : '0 2px 6px rgba(0, 0, 0, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {city === 'ALL' ? 'All Metros' : city}
                  </button>
                );
              })}
            </div>

            {/* Genre Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="meta-text-sm"
                style={{
                  marginRight: '0.5rem',
                  fontWeight: 700,
                  color: 'var(--color-paper-muted)',
                }}
              >
                GENRE:
              </span>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    style={{
                      borderRadius: '9999px',
                      padding: '0.35rem 0.95rem',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? 'var(--color-charcoal)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--color-paper-muted)',
                      border: isActive ? '1px solid var(--color-charcoal)' : '1px solid rgba(20, 20, 20, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asymmetric Mosaic of Floating Event Artwork Cards */}
          <div style={{ marginTop: '3rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span className="section-header-kicker">EDITORIAL MOSAIC</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Curated Highlights at a Glance</h3>
              </div>
              <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                4 CURATED VENUE PREVIEWS
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                alignItems: 'stretch',
              }}
            >
              {HERO_MOSAIC_CARDS.map((mosaic) => (
                <Link
                  key={mosaic.id}
                  href={`/events/${mosaic.id}`}
                  className="gallery-mosaic-card"
                  style={{
                    height: mosaic.height,
                    position: 'relative',
                    borderRadius: '16px',
                  }}
                >
                  <img
                    src={mosaic.image}
                    alt={mosaic.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(20, 20, 20, 0.1) 0%, rgba(20, 20, 20, 0.85) 90%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span
                        className="badge-pill"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: 'var(--color-charcoal)',
                          fontWeight: 700,
                        }}
                      >
                        {mosaic.category}
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(200, 75, 49, 0.9)',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-mono-stack)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {mosaic.date}
                      </span>
                    </div>

                    <div>
                      <div
                        style={{
                          color: '#FFFFFF',
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          lineHeight: 1.2,
                        }}
                      >
                        {mosaic.title}
                      </div>
                      <div
                        style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.8rem',
                          marginTop: '0.25rem',
                        }}
                      >
                        📍 {mosaic.city} • {mosaic.subtitle}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Lineup Section */}
      <section id="lineup" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            <div>
              <span className="section-header-kicker">
                {isLoading ? 'SYNCING CATALOG...' : `SHOWING ${events.length} ADMISSION MANIFESTS`}
              </span>
              <h2 style={{ marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                UPCOMING SHOWS &amp; CURATIONS
              </h2>
            </div>
            <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
              ALL TIMES IN INDIAN STANDARD TIME (IST)
            </div>
          </div>

          {events.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                borderRadius: '18px',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(20, 20, 20, 0.05)',
              }}
            >
              <h3 style={{ marginBottom: '0.75rem' }}>No Matches Found in Curated Lineup</h3>
              <p className="type-body" style={{ margin: '0 auto 1.5rem', color: 'var(--color-paper-muted)' }}>
                No events matched your current filter criteria (
                {selectedCity !== 'ALL' ? selectedCity : ''}{' '}
                {selectedCategory !== 'ALL' ? selectedCategory : ''}{' '}
                {searchTerm ? `"${searchTerm}"` : ''}).
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCity('ALL');
                  setSelectedCategory('ALL');
                  setSearchTerm('');
                  showToast('Filters cleared', 'info');
                }}
                className="btn btn-cyan btn-sm btn-pill"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              {/* 1. Large Headliner Ticket Slab */}
              {headliner && <TicketRow event={headliner} />}

              {/* 2. Compact Curated Ticket Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {regularEvents.map((ev) => (
                  <TicketRow key={ev.id} event={ev} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Editorial Value Section: WHY CHOOSE PULSE & PASS */}
      <section
        style={{
          paddingTop: '4.5rem',
          paddingBottom: '4.5rem',
          borderTop: '1px solid rgba(20, 20, 20, 0.07)',
          backgroundColor: '#FAF8F5',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '640px', marginBottom: '2.5rem' }}>
            <span className="section-header-kicker">THE BOX OFFICE STANDARD</span>
            <h2 style={{ letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
              WHY CHOOSE PULSE &amp; PASS
            </h2>
            <p className="type-body" style={{ marginTop: '0.5rem', color: 'var(--color-paper-muted)' }}>
              Built for discerning patrons and high-throughput arenas with strict transactional
              integrity and physical ticket aesthetics.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                padding: '2rem',
                boxShadow: '0 4px 20px rgba(20, 20, 20, 0.04)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(200, 75, 49, 0.1)',
                  color: 'var(--color-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                ⏱️
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                5-Minute Atomic Hold
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--color-paper-80)', lineHeight: 1.6 }}>
                Once you select a pass tier, your reservation is cryptographically locked for 300
                seconds. Zero cart-snatching, race conditions, or sudden sold-out errors at payment.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                padding: '2rem',
                boxShadow: '0 4px 20px rgba(20, 20, 20, 0.04)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(200, 75, 49, 0.1)',
                  color: 'var(--color-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                🏛️
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Museum-Grade Curation
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--color-paper-80)', lineHeight: 1.6 }}>
                Every event on Pulse &amp; Pass is verified with authorized venue gatekeepers. From
                symphonic halls to premier tech summits, enjoy acoustic brilliance and premium seating.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                padding: '2rem',
                boxShadow: '0 4px 20px rgba(20, 20, 20, 0.04)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(200, 75, 49, 0.1)',
                  color: 'var(--color-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                🎫
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Tamper-Proof Turnstiles
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--color-paper-80)', lineHeight: 1.6 }}>
                Instant issuance of encrypted QR gate passes. Scannable offline at venue turnstiles with
                anti-screenshot rotating verification and instant admittance logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Testimonials: WHAT ATTENDEES SAY */}
      <section
        style={{
          paddingTop: '4.5rem',
          paddingBottom: '4.5rem',
          borderTop: '1px solid rgba(20, 20, 20, 0.07)',
          backgroundColor: 'var(--color-ink)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '640px', marginBottom: '2.5rem' }}>
            <span className="section-header-kicker">PATRON REVIEWS</span>
            <h2 style={{ letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
              WHAT ATTENDEES SAY
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                padding: '2rem',
                boxShadow: '0 4px 18px rgba(20, 20, 20, 0.03)',
              }}
            >
              <div style={{ color: 'var(--color-terracotta)', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                ★★★★★
              </div>
              <p
                style={{
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--color-charcoal)',
                  marginBottom: '1.25rem',
                }}
              >
                &ldquo;Booking passes for the Full Stack Systems Conclave was effortless. The 5-minute hold gave me time to coordinate with my engineering team without losing VIP seats.&rdquo;
              </p>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Aarav Natarajan</div>
                <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  Principal Architect • Bengaluru
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                padding: '2rem',
                boxShadow: '0 4px 18px rgba(20, 20, 20, 0.03)',
              }}
            >
              <div style={{ color: 'var(--color-terracotta)', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                ★★★★★
              </div>
              <p
                style={{
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--color-charcoal)',
                  marginBottom: '1.25rem',
                }}
              >
                &ldquo;The physical ticket look and feel brings back the romance of classical concert programmes. NCPA turnstiles scanned our passes in less than a second.&rdquo;
              </p>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Sunita Mehra</div>
                <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  Symphony Patron • Mumbai
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                padding: '2rem',
                boxShadow: '0 4px 18px rgba(20, 20, 20, 0.03)',
              }}
            >
              <div style={{ color: 'var(--color-terracotta)', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                ★★★★★
              </div>
              <p
                style={{
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--color-charcoal)',
                  marginBottom: '1.25rem',
                }}
              >
                &ldquo;The seamless instant demo pass simulation allowed our hackathon team to test the turnstile gating workflow with zero friction. Outstanding engineering.&rdquo;
              </p>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Kavya Deshmukh</div>
                <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  Event Organizer • Hyderabad
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venues Spotlight Section: CURATED VENUES NETWORK */}
      <section
        id="venues"
        style={{
          paddingTop: '4.5rem',
          paddingBottom: '4.5rem',
          borderTop: '1px solid rgba(20, 20, 20, 0.07)',
          backgroundColor: '#FAF8F5',
        }}
      >
        <div className="container">
          <div style={{ marginBottom: '2.5rem' }}>
            <span className="section-header-kicker">GATEWAYS &amp; ARENAS</span>
            <h2 style={{ marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
              CURATED VENUES NETWORK
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                boxShadow: '0 4px 20px rgba(20, 20, 20, 0.04)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="badge-pill">HYDERABAD</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                  HITEX Exhibition Centre
                </h3>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-paper-muted)',
                    lineHeight: 1.55,
                    marginBottom: '1.25rem',
                  }}
                >
                  Trade Fair Grounds, IZZAT Nagar. 12,000 attendee capacity across 3 acoustically treated halls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCityChange('Hyderabad')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-terracotta)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                }}
              >
                View Hyderabad Shows →
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                boxShadow: '0 4px 20px rgba(20, 20, 20, 0.04)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="badge-pill">BENGALURU</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                  Chowdiah Memorial Hall
                </h3>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-paper-muted)',
                    lineHeight: 1.55,
                    marginBottom: '1.25rem',
                  }}
                >
                  16th Cross, Malleswaram. Iconic violin-shaped auditorium, 1,000 attendee capacity with natural acoustics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCityChange('Bengaluru')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-terracotta)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                }}
              >
                View Bengaluru Shows →
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                boxShadow: '0 4px 20px rgba(20, 20, 20, 0.04)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="badge-pill">MUMBAI</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                  NCPA Tata Theatre
                </h3>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-paper-muted)',
                    lineHeight: 1.55,
                    marginBottom: '1.25rem',
                  }}
                >
                  Nariman Point. Premier symphonic and classical auditorium, 1,010 capacity overlooking the Arabian Sea.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCityChange('Mumbai')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-terracotta)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                }}
              >
                View Mumbai Shows →
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

import React from 'react';
import Link from 'next/link';
import type { BoxOfficeEvent } from '../data/seeded-events';

interface TicketRowProps {
  event: BoxOfficeEvent;
}

const CATEGORY_THUMBNAILS: Record<string, string> = {
  music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
  conclave: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
  classical: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
  comedy: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  arts: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
  sports: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
};

export function TicketRow({ event }: TicketRowProps) {
  const isHeadliner = Boolean(event.isHeadliner);
  const catKey = (event.category || '').toLowerCase();
  const posterUrl = CATEGORY_THUMBNAILS[catKey] || CATEGORY_THUMBNAILS.default;

  const getStampClass = (status: BoxOfficeEvent['status']) => {
    switch (status) {
      case 'ON SALE':
        return 'stamp stamp-onsale';
      case 'FEW LEFT':
        return 'stamp stamp-onsale';
      case 'SOLD OUT':
        return 'stamp stamp-void';
      default:
        return 'stamp stamp-onsale';
    }
  };

  if (isHeadliner) {
    return (
      <article className="ticket-wrapper" style={{ marginBottom: '2.5rem' }}>
        <div
          className="ticket-row"
          style={{
            minHeight: '260px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '18px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Gallery Poster Thumbnail Frame */}
          <div
            className="ticket-poster-thumb"
            style={{
              width: '240px',
              minHeight: '100%',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={posterUrl}
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
                top: '12px',
                left: '12px',
                zIndex: 2,
              }}
            >
              <span className="badge-pill badge-terracotta" style={{ backdropFilter: 'blur(4px)' }}>
                ★ HEADLINER
              </span>
            </div>
          </div>

          {/* Main Body */}
          <div className="ticket-body" style={{ padding: 'clamp(1.5rem, 3.2vw, 2.25rem)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}
              >
                <span className="badge-pill">{event.category}</span>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  DOORS OPEN: {event.gateTime}
                </span>
              </div>
              <span className={getStampClass(event.status)}>{event.status}</span>
            </div>

            <div>
              <h2
                style={{
                  fontSize: 'clamp(1.6rem, 2.8vw, 2.25rem)',
                  marginTop: '0.4rem',
                  marginBottom: '0.6rem',
                  lineHeight: 1.15,
                }}
              >
                <Link
                  href={`/events/${event.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {event.title}
                </Link>
              </h2>
              {event.description && (
                <p
                  className="type-body"
                  style={{
                    color: 'var(--color-paper-80)',
                    marginBottom: '0.75rem',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                  }}
                >
                  {event.description}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '1rem',
                borderTop: '1px solid rgba(20, 20, 20, 0.06)',
                paddingTop: '0.85rem',
              }}
            >
              <div>
                <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  VENUE &amp; CITY
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--color-charcoal)',
                    marginTop: '0.2rem',
                  }}
                >
                  📍 {event.venueName}, {event.cityName}
                </div>
                {event.tierSummary && (
                  <div
                    className="meta-text-sm"
                    style={{ color: 'var(--color-terracotta)', marginTop: '0.25rem' }}
                  >
                    {event.tierSummary}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  ADMISSION FROM
                </div>
                <div className="price-tag-lg" style={{ fontSize: '1.65rem' }}>
                  ₹{event.minPrice.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Perforation Divider with subtle notches */}
          <div className="ticket-perforation-v" aria-hidden="true" />

          {/* Right Ticket Stub */}
          <div
            className="ticket-stub"
            style={{
              width: '230px',
              padding: '1.75rem 1.25rem',
              backgroundColor: 'var(--color-surface-warm)',
            }}
          >
            <div style={{ width: '100%' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono-stack)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--color-charcoal)',
                }}
              >
                {event.dayNumber}
              </div>
              <div
                className="meta-text"
                style={{
                  color: 'var(--color-paper-muted)',
                  marginTop: '0.25rem',
                  fontWeight: 700,
                }}
              >
                {event.monthYear}
              </div>
              <div
                className="meta-text-sm"
                style={{ color: 'var(--color-paper-dim)', marginTop: '0.15rem' }}
              >
                {event.dayOfWeek}
              </div>
            </div>

            {/* Stylized Minimal Turnstile Indicator */}
            <div
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid rgba(20, 20, 20, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono-stack)',
                  color: 'var(--color-paper-dim)',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                PASS MANIFEST
              </span>
            </div>

            <div style={{ width: '100%' }}>
              <div
                className="meta-text-sm"
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-paper-dim)',
                  marginBottom: '0.5rem',
                }}
              >
                MANIFEST: {event.serialCode}
              </div>
              <Link
                href={`/events/${event.id}`}
                className="btn btn-cyan btn-sm"
                style={{
                  width: '100%',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                Book Pass →
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard Compact Event Ticket Row as Curated Gallery Entry
  return (
    <article className="ticket-wrapper" style={{ marginBottom: '1.25rem' }}>
      <div
        className="ticket-row"
        style={{
          minHeight: '140px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '18px',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Gallery Poster Thumbnail Frame */}
        <div
          className="ticket-poster-thumb"
          style={{
            width: '140px',
            minHeight: '100%',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={posterUrl}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        {/* Main Body */}
        <div
          className="ticket-body"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '1.25rem 1.75rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Big Date Block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '70px',
              borderRight: '1px solid rgba(20, 20, 20, 0.06)',
              paddingRight: '1.25rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono-stack)',
                fontSize: '1.85rem',
                fontWeight: 800,
                lineHeight: 1,
                color: 'var(--color-charcoal)',
              }}
            >
              {event.dayNumber}
            </div>
            <div
              className="meta-text-sm"
              style={{
                color: 'var(--color-paper-muted)',
                marginTop: '0.2rem',
                fontWeight: 700,
              }}
            >
              {event.monthYear.split(' ')[0]}
            </div>
          </div>

          {/* Event Details */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.35rem',
              }}
            >
              <span className="badge-pill">{event.category}</span>
              <span className="meta-text-sm" style={{ color: 'var(--color-paper-dim)' }}>
                DOORS {event.gateTime}
              </span>
            </div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '0.25rem',
                lineHeight: 1.25,
              }}
            >
              <Link
                href={`/events/${event.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {event.title}
              </Link>
            </h3>
            <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
              📍 {event.venueName}, {event.cityName}
            </div>
          </div>

          {/* Price Block */}
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
              FROM
            </div>
            <div className="price-tag" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              ₹{event.minPrice.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Perforation Line with Edge Notches */}
        <div className="ticket-perforation-v" aria-hidden="true" />

        {/* Ticket Stub Right */}
        <div
          className="ticket-stub"
          style={{
            width: '180px',
            padding: '1.25rem 1rem',
            justifyContent: 'center',
            gap: '0.65rem',
            backgroundColor: 'var(--color-surface-warm)',
          }}
        >
          <span className={getStampClass(event.status)}>{event.status}</span>
          <span
            className="meta-text-sm"
            style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}
          >
            {event.serialCode}
          </span>
          {event.status !== 'SOLD OUT' ? (
            <Link
              href={`/events/${event.id}`}
              className="btn btn-cyan btn-sm"
              style={{
                width: '100%',
                fontSize: '0.75rem',
                padding: '0.45rem 0.75rem',
                minHeight: '34px',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 700,
              }}
            >
              Book Pass →
            </Link>
          ) : (
            <span
              className="meta-text-sm"
              style={{
                color: 'var(--color-void)',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              OFF SALE
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

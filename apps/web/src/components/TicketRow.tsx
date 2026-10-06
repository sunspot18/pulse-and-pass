import Link from 'next/link';
import type { BoxOfficeEvent } from '../data/seeded-events';

interface TicketRowProps {
  event: BoxOfficeEvent;
}

export function TicketRow({ event }: TicketRowProps) {
  const isHeadliner = Boolean(event.isHeadliner);

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
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {/* Main Body */}
          <div className="ticket-body" style={{ padding: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge-pill">FEATURED HEADLINER</span>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  GATE TIME: {event.gateTime}
                </span>
              </div>
              <span className={getStampClass(event.status)}>{event.status}</span>
            </div>

            <div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                {event.title}
              </h2>
              {event.description && (
                <p className="type-body-lg" style={{ marginBottom: '1rem' }}>
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
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: '1rem',
              }}
            >
              <div>
                <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                  VENUE &amp; CITY
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.2rem' }}>
                  {event.venueName}, {event.cityName}
                </div>
                {event.tierSummary && (
                  <div className="meta-text-sm" style={{ color: 'var(--color-amber)', marginTop: '0.25rem' }}>
                    {event.tierSummary}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="meta-text-sm">ADMISSION FROM</div>
                <div className="price-tag-lg">₹{event.minPrice.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Perforation Line with Top and Bottom Edge Notches */}
          <div className="ticket-perforation-v" aria-hidden="true" />

          {/* Right Ticket Stub */}
          <div className="ticket-stub" style={{ width: '240px', padding: '2rem 1.5rem' }}>
            <div style={{ width: '100%' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono-stack)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--color-paper)',
                }}
              >
                {event.dayNumber}
              </div>
              <div className="meta-text" style={{ color: 'var(--color-paper-muted)', marginTop: '0.25rem' }}>
                {event.monthYear}
              </div>
              <div className="meta-text-sm" style={{ color: 'var(--color-paper-dim)', marginTop: '0.15rem' }}>
                {event.dayOfWeek}
              </div>
            </div>

            {/* Turnstile Barcode Mockup */}
            <div
              style={{
                width: '100%',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(244, 241, 234, 0.06)',
                border: '1px solid var(--color-border-subtle)',
                padding: '4px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background:
                    'repeating-linear-gradient(90deg, #F4F1EA, #F4F1EA 2px, transparent 2px, transparent 6px, #F4F1EA 6px, #F4F1EA 10px, transparent 10px, transparent 13px)',
                  opacity: 0.6,
                }}
              />
            </div>

            <div style={{ width: '100%' }}>
              <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-dim)', marginBottom: '0.5rem' }}>
                SERIAL: {event.serialCode}
              </div>
              <Link href={`/#event-${event.id}`} className="btn btn-cyan btn-sm" style={{ width: '100%' }}>
                BOOK PASS
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard Compact Event Ticket Row
  return (
    <article className="ticket-wrapper" style={{ marginBottom: '1.25rem' }}>
      <div className="ticket-row" style={{ minHeight: '140px' }}>
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
              minWidth: '80px',
              borderRight: '1px solid var(--color-border-subtle)',
              paddingRight: '1.25rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono-stack)',
                fontSize: '2rem',
                fontWeight: 800,
                lineHeight: 1,
                color: 'var(--color-paper)',
              }}
            >
              {event.dayNumber}
            </div>
            <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.2rem' }}>
              {event.monthYear.split(' ')[0]}
            </div>
          </div>

          {/* Event Details */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge-pill">{event.category}</span>
              <span className="meta-text-sm" style={{ color: 'var(--color-paper-dim)' }}>
                DOORS {event.gateTime}
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {event.title}
            </h3>
            <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
              {event.venueName}, {event.cityName}
            </div>
          </div>

          {/* Price Block */}
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <div className="meta-text-sm">FROM</div>
            <div className="price-tag">₹{event.minPrice.toLocaleString('en-IN')}</div>
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
            gap: '0.75rem',
          }}
        >
          <span className={getStampClass(event.status)}>{event.status}</span>
          <span className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>
            {event.serialCode}
          </span>
          {event.status !== 'SOLD OUT' ? (
            <Link
              href={`/#event-${event.id}`}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '0.7rem', padding: '0.4rem 0.6rem', minHeight: '34px' }}
            >
              GET PASS →
            </Link>
          ) : (
            <span
              className="meta-text-sm"
              style={{
                color: 'var(--color-void)',
                fontWeight: 700,
                fontSize: '0.7rem',
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

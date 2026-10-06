import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TicketRow } from '../components/TicketRow';
import { SEEDED_LINEUP } from '../data/seeded-events';

export default function HomePage() {
  const headliner = SEEDED_LINEUP[0];
  const regularEvents = SEEDED_LINEUP.slice(1);

  return (
    <>
      <Navbar />

      {/* Hero Box Office Header */}
      <section
        style={{
          paddingTop: 'clamp(2.5rem, 6vw, 5rem)',
          paddingBottom: 'clamp(2rem, 4vw, 3.5rem)',
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span className="badge-pill">BOX OFFICE OPEN</span>
              <span className="meta-text-sm" style={{ color: 'var(--color-amber)' }}>
                ● GATES ACTIVE
              </span>
            </div>

            <h1 style={{ marginBottom: '1rem' }}>Tonight in Hyderabad</h1>

            <p className="type-body-lg" style={{ marginBottom: '2rem' }}>
              14 shows on sale across premier venues. Guaranteed atomic seating, instant cryptographic
              gate admission passes, and real-time tier availability.
            </p>

            {/* City Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}>
                Hyderabad (8)
              </span>
              <span className="btn btn-ghost btn-sm">Bengaluru (6)</span>
              <span className="btn btn-ghost btn-sm">Mumbai (4)</span>
              <span className="btn btn-ghost btn-sm">Delhi (2)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Lineup Section (Asymmetric Ticket Rows) */}
      <section id="lineup" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <span className="meta-label">BOX OFFICE LINEUP</span>
              <h2 style={{ marginTop: '0.25rem' }}>Selected Shows &amp; Headliners</h2>
            </div>
            <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
              ALL TIMES IN INDIAN STANDARD TIME (IST)
            </div>
          </div>

          {/* 1. Large Headliner Ticket Slab */}
          {headliner && <TicketRow event={headliner} />}

          {/* 2. Compact Ticket Rows of Different Sizes */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {regularEvents.map((ev) => (
              <TicketRow key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      </section>

      {/* Venues Spotlight Section */}
      <section
        id="venues"
        style={{
          paddingTop: '3.5rem',
          paddingBottom: '3.5rem',
          borderTop: '2px solid var(--color-border)',
          backgroundColor: 'rgba(23, 24, 27, 0.4)',
        }}
      >
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <span className="meta-label">GATEWAYS &amp; ARENAS</span>
            <h2 style={{ marginTop: '0.25rem' }}>Official Venue Network</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-hard)',
                padding: '1.5rem',
              }}
            >
              <span className="badge-pill">HYDERABAD</span>
              <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                HITEX Exhibition Centre
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-paper-muted)', marginBottom: '1rem' }}>
                Trade Fair Grounds, IZZAT Nagar. 12,000 attendee capacity across 3 halls.
              </p>
              <span className="meta-text-sm" style={{ color: 'var(--color-cyan)' }}>
                4 UPCOMING SHOWS →
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-hard)',
                padding: '1.5rem',
              }}
            >
              <span className="badge-pill">BENGALURU</span>
              <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                Chowdiah Memorial Hall
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-paper-muted)', marginBottom: '1rem' }}>
                16th Cross, Malleswaram. Acoustic violin-shaped auditorium, 1,000 capacity.
              </p>
              <span className="meta-text-sm" style={{ color: 'var(--color-cyan)' }}>
                3 UPCOMING SHOWS →
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-hard)',
                padding: '1.5rem',
              }}
            >
              <span className="badge-pill">MUMBAI</span>
              <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                NCPA Tata Theatre
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-paper-muted)', marginBottom: '1rem' }}>
                Nariman Point. Premier symphonic and classical auditorium, 1,010 capacity.
              </p>
              <span className="meta-text-sm" style={{ color: 'var(--color-cyan)' }}>
                2 UPCOMING SHOWS →
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

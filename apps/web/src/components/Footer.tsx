import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        marginTop: '5rem',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '2.5rem',
          }}
        >
          <div style={{ maxWidth: '380px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display-stack)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-paper)',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--color-cyan)' }}>⚡</span> PULSE &amp; PASS
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-paper-muted)' }}>
              Official box office admission gate system. Real-time tier reservations, verified
              turnstile admission passes, and tamper-proof ticket issuance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <div className="meta-text" style={{ color: 'var(--color-paper)', marginBottom: '0.75rem' }}>
                Box Office
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>
                  <Link href="/#lineup" className="meta-text-sm" style={{ textDecoration: 'none' }}>
                    Tonight Lineup
                  </Link>
                </li>
                <li>
                  <Link href="/#venues" className="meta-text-sm" style={{ textDecoration: 'none' }}>
                    Venue Directory
                  </Link>
                </li>
                <li>
                  <Link href="/styleguide" className="meta-text-sm" style={{ textDecoration: 'none' }}>
                    Design System
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="meta-text" style={{ color: 'var(--color-paper)', marginBottom: '0.75rem' }}>
                Gate Policy
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li className="meta-text-sm">Gates Open 18:00</li>
                <li className="meta-text-sm">Digital QR Verification</li>
                <li className="meta-text-sm">Government Photo ID Req.</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <span className="meta-text-sm" style={{ color: 'var(--color-paper-dim)' }}>
            © 2026 PULSE &amp; PASS BOX OFFICE. ALL RIGHTS RESERVED.
          </span>
          <span className="meta-text-sm" style={{ color: 'var(--color-paper-dim)' }}>
            HYDERABAD • BENGALURU • MUMBAI • DELHI
          </span>
        </div>
      </div>
    </footer>
  );
}

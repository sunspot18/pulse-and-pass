import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export default function StyleguidePage() {
  return (
    <>
      <Navbar />

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <div
          style={{
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: '1.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span className="meta-label">DESIGN SYSTEM REFERENCE</span>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: '0.25rem' }}>
              Styleguide &amp; Tokens
            </h1>
          </div>
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Back to Shows
          </Link>
        </div>

        {/* 2-Column Layout: Left Sidebar Index + Main Content */}
        <div className="styleguide-grid">
          {/* Left Sticky Sidebar Index */}
          <aside className="styleguide-sidebar">
            <div className="meta-label" style={{ color: 'var(--color-paper)', marginBottom: '0.75rem' }}>
              Index
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#palette" className="meta-text-sm" style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}>
                Palette Swatches
              </a>
              <a href="#typography" className="meta-text-sm" style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}>
                Type Hierarchy
              </a>
              <a href="#tickets" className="meta-text-sm" style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}>
                Ticket Geometry
              </a>
              <a href="#buttons" className="meta-text-sm" style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}>
                Button Actions
              </a>
              <a href="#stamps" className="meta-text-sm" style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}>
                Status Stamps
              </a>
              <a href="#inputs" className="meta-text-sm" style={{ textDecoration: 'none', color: 'var(--color-paper-muted)' }}>
                Form Controls
              </a>
            </nav>
          </aside>

          {/* Main Content Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', minWidth: 0 }}>
            {/* 1. COMPACT HORIZONTAL PALETTE STRIP */}
            <section id="palette">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Palette Swatches</h2>
              <p className="type-body" style={{ marginBottom: '1.25rem' }}>
                Strict 2-surface architecture: Ink (#0F1012) background and Surface (#17181B). Cyan is
                reserved for primary actions and focus rings; Amber for tier prices and on-sale state;
                Red for error states.
              </p>

              {/* Compact horizontal swatch strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  border: '2px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '1rem', borderRight: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: '100%', height: '36px', backgroundColor: '#0F1012', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }} />
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper)' }}>INK</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-dim)' }}>#0F1012</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>BG BASE</div>
                </div>

                <div style={{ padding: '1rem', borderRight: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: '100%', height: '36px', backgroundColor: '#17181B', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }} />
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper)' }}>SURFACE</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-dim)' }}>#17181B</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>1.1:1 RATIO</div>
                </div>

                <div style={{ padding: '1rem', borderRight: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: '100%', height: '36px', backgroundColor: '#F4F1EA', marginBottom: '0.5rem' }} />
                  <div className="meta-text-sm" style={{ color: 'var(--color-paper)' }}>PAPER</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-dim)' }}>#F4F1EA</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>18.2:1 (AAA)</div>
                </div>

                <div style={{ padding: '1rem', borderRight: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: '100%', height: '36px', backgroundColor: '#00F0FF', marginBottom: '0.5rem' }} />
                  <div className="meta-text-sm" style={{ color: 'var(--color-cyan)' }}>CYAN</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-dim)' }}>#00F0FF</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>PRIMARY ACT</div>
                </div>

                <div style={{ padding: '1rem', borderRight: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: '100%', height: '36px', backgroundColor: '#FFB800', marginBottom: '0.5rem' }} />
                  <div className="meta-text-sm" style={{ color: 'var(--color-amber)' }}>AMBER</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-dim)' }}>#FFB800</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>TIER / SALE</div>
                </div>

                <div style={{ padding: '1rem' }}>
                  <div style={{ width: '100%', height: '36px', backgroundColor: '#FF3838', marginBottom: '0.5rem' }} />
                  <div className="meta-text-sm" style={{ color: 'var(--color-void)' }}>VOID</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-dim)' }}>#FF3838</div>
                  <div className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>ERROR ONLY</div>
                </div>
              </div>
            </section>

            {/* 2. STRICT TYPE HIERARCHY */}
            <section id="typography">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Type Hierarchy</h2>
              <p className="type-body" style={{ marginBottom: '1.25rem' }}>
                One strict scale: 12 / 14 / 16 / 20 / 28 / 44 / 72. Display wide font is used only
                for H1 and logo. Body copy uses Space Grotesk at 80% opacity. JetBrains Mono is
                strictly reserved for metadata, prices, and serials.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-border)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                <div>
                  <span className="meta-label">72PX // H1 DISPLAY WIDE (SYNE)</span>
                  <div className="type-h1" style={{ fontSize: '2.5rem', marginTop: '0.25rem' }}>
                    Tonight in Hyderabad
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
                  <span className="meta-label">44PX // H2 SECTION TITLE (SPACE GROTESK BOLD)</span>
                  <div className="type-h2" style={{ marginTop: '0.25rem' }}>
                    Selected Shows &amp; Headliners
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
                  <span className="meta-label">28PX // H3 COMPONENT HEADING (SPACE GROTESK BOLD)</span>
                  <div className="type-h3" style={{ marginTop: '0.25rem' }}>
                    Echoes of Deccan: Fusion Music Festival 2026
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
                  <span className="meta-label">20PX // H4 SUBHEADING (SPACE GROTESK BOLD)</span>
                  <div className="type-h4" style={{ marginTop: '0.25rem' }}>
                    General Admission &amp; VIP All-Access Tiers
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
                  <span className="meta-label">16PX // BODY COPY (SPACE GROTESK, 80% PAPER OPACITY)</span>
                  <p className="type-body" style={{ marginTop: '0.25rem' }}>
                    Standard body copy renders in clean sentence case with a comfortable line-height of
                    1.6 and clamped line length. Never rendered in monospace.
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
                  <span className="meta-label">14PX &amp; 12PX // METADATA &amp; PRICE (JETBRAINS MONO)</span>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="meta-text">SATURDAY, 24 OCT 2026</span>
                    <span className="meta-text-sm">DOORS 18:00 IST</span>
                    <span className="price-tag">₹999</span>
                    <span className="meta-text-sm" style={{ color: 'var(--color-paper-dim)' }}>
                      SERIAL: PNP-HYD-DEC24
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. TICKET GEOMETRY & PERFORATION NOTCHES */}
            <section id="tickets">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Ticket Geometry</h2>
              <p className="type-body" style={{ marginBottom: '1.25rem' }}>
                Edge notches are semicircles cut exactly on the outer edges along the perforation line,
                letting the deep ink page background show through. The outer wrapper maintains a hard 6px
                offset shadow without blur.
              </p>

              <div className="ticket-wrapper">
                <div className="ticket-row" style={{ minHeight: '130px' }}>
                  <div className="ticket-body" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="meta-text-sm">HEADLINER PASS</div>
                      <h3 style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>
                        Deccan Symphony Live Pass
                      </h3>
                      <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.25rem' }}>
                        HITEX Arena, Hyderabad • Tier 1
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="meta-text-sm">ADMISSION</div>
                      <div className="price-tag">₹1,499</div>
                    </div>
                  </div>

                  <div className="ticket-perforation-v" aria-hidden="true" />

                  <div className="ticket-stub" style={{ width: '160px', justifyContent: 'center' }}>
                    <span className="stamp stamp-onsale">ON SALE</span>
                    <span className="meta-text-sm" style={{ fontSize: '0.65rem', color: 'var(--color-paper-dim)' }}>
                      PNP-DEMO-001
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. BUTTON ACTIONS */}
            <section id="buttons">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Button Actions</h2>
              <p className="type-body" style={{ marginBottom: '1.25rem' }}>
                Cyan is strictly reserved for primary actions. Secondary actions use surface with
                2px paper border at 20% opacity.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <button className="btn btn-cyan">PRIMARY ACTION</button>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center' }}>.btn-cyan</div>
                </div>
                <div>
                  <button className="btn btn-secondary">SECONDARY ACTION</button>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center' }}>.btn-secondary</div>
                </div>
                <div>
                  <button className="btn btn-ghost">GHOST ACTION</button>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center' }}>.btn-ghost</div>
                </div>
                <div>
                  <button className="btn btn-cyan btn-sm">COMPACT</button>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center' }}>.btn-sm</div>
                </div>
              </div>
            </section>

            {/* 5. STATUS STAMPS */}
            <section id="stamps">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Status Stamps</h2>
              <p className="type-body" style={{ marginBottom: '1.25rem' }}>
                Rotated -3deg, max one stamp per ticket. Amber for on sale; Cyan for gate admitted;
                Red for error / void.
              </p>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <span className="stamp stamp-onsale">ON SALE</span>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem' }}>.stamp-onsale</div>
                </div>
                <div>
                  <span className="stamp stamp-admitted">GATE ADMITTED</span>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem' }}>.stamp-admitted</div>
                </div>
                <div>
                  <span className="stamp stamp-void">SOLD OUT</span>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem' }}>.stamp-void</div>
                </div>
                <div>
                  <span className="stamp stamp-headliner">HEADLINER PASS</span>
                  <div className="meta-text-sm" style={{ marginTop: '0.5rem' }}>.stamp-headliner</div>
                </div>
              </div>
            </section>

            {/* 6. FORM CONTROLS */}
            <section id="inputs">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Form Controls</h2>
              <p className="type-body" style={{ marginBottom: '1.25rem' }}>
                Inputs on surface #17181B with 2px paper-20% border. Focus ring uses electric cyan.
              </p>

              <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="meta-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                    Attendee Full Name
                  </label>
                  <input
                    type="text"
                    className="input-box"
                    placeholder="e.g. Rishika Deshmukh"
                    defaultValue="Rishika Deshmukh"
                  />
                </div>
                <div>
                  <label className="meta-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                    Mobile Number (SMS Delivery)
                  </label>
                  <input
                    type="text"
                    className="input-box"
                    placeholder="+91 98765 43210"
                    defaultValue="+91 98765 43210"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

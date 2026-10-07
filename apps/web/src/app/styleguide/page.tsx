import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export default function StyleguidePage() {
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
              gap: '1.25rem',
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
                  DESIGN SYSTEM
                </span>
                <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', fontWeight: 600 }}>
                  EDITORIAL BOX OFFICE TOKENS
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-charcoal)', margin: 0 }}>
                Styleguide &amp; Tokens
              </h1>
              <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: 'var(--color-paper-80)' }}>
                Warm tactile sandstone palette, museum box office grotesque typography, pure white card surfaces,
                delicate neutral borders, and signature terracotta accents.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href="/events"
                className="btn btn-secondary btn-sm btn-pill"
                style={{ textDecoration: 'none', padding: '0.55rem 1.15rem' }}
              >
                PUBLIC LINEUP →
              </Link>
              <Link
                href="/"
                className="btn btn-ghost btn-sm btn-pill"
                style={{ textDecoration: 'none', padding: '0.55rem 1.15rem' }}
              >
                ← BACK TO SHOWS
              </Link>
            </div>
          </div>

          {/* 2-Column Layout: Left Sticky Sidebar + Main Content Panels */}
          <div className="styleguide-grid">
            {/* Left Sticky Sidebar Index */}
            <aside className="styleguide-sidebar">
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '18px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="meta-label" style={{ color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>
                  TOKEN INDEX
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <a
                    href="#palette"
                    className="meta-text-sm"
                    style={{ textDecoration: 'none', color: 'var(--color-paper-muted)', fontWeight: 600 }}
                  >
                    1. Palette Swatches
                  </a>
                  <a
                    href="#typography"
                    className="meta-text-sm"
                    style={{ textDecoration: 'none', color: 'var(--color-paper-muted)', fontWeight: 600 }}
                  >
                    2. Type Hierarchy
                  </a>
                  <a
                    href="#tickets"
                    className="meta-text-sm"
                    style={{ textDecoration: 'none', color: 'var(--color-paper-muted)', fontWeight: 600 }}
                  >
                    3. Ticket Geometry
                  </a>
                  <a
                    href="#buttons"
                    className="meta-text-sm"
                    style={{ textDecoration: 'none', color: 'var(--color-paper-muted)', fontWeight: 600 }}
                  >
                    4. Button Actions
                  </a>
                  <a
                    href="#stamps"
                    className="meta-text-sm"
                    style={{ textDecoration: 'none', color: 'var(--color-paper-muted)', fontWeight: 600 }}
                  >
                    5. Status Badges
                  </a>
                  <a
                    href="#inputs"
                    className="meta-text-sm"
                    style={{ textDecoration: 'none', color: 'var(--color-paper-muted)', fontWeight: 600 }}
                  >
                    6. Form Controls
                  </a>
                </nav>
              </div>
            </aside>

            {/* Main Content Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', minWidth: 0 }}>
              {/* 1. EDITORIAL PALETTE SWATCHES */}
              <section id="palette">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>SECTION 01</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-charcoal)', marginBottom: '0.4rem' }}>
                  Editorial Palette Swatches
                </h2>
                <p style={{ color: 'var(--color-paper-80)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  A curated warm-tactile color system inspired by museum and arts &amp; culture box offices.
                  The canvas uses warm parchment (#F5EFE6), content elevates on pure white (#FFFFFF),
                  typography is deep charcoal (#141414), and signature CTAs shine in terracotta (#C84B31).
                </p>

                {/* Swatch Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    borderRadius: '18px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Parchment Base */}
                  <div style={{ padding: '1.25rem', borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#F5EFE6',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      PARCHMENT
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono-stack)', color: 'var(--color-paper-muted)' }}>
                      #F5EFE6
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                      CANVAS BASE
                    </div>
                  </div>

                  {/* Surface Pure White */}
                  <div style={{ padding: '1.25rem', borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      CARD SURFACE
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono-stack)', color: 'var(--color-paper-muted)' }}>
                      #FFFFFF
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                      PURE WHITE
                    </div>
                  </div>

                  {/* Deep Charcoal */}
                  <div style={{ padding: '1.25rem', borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#141414',
                        borderRadius: '8px',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      CHARCOAL
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono-stack)', color: 'var(--color-paper-muted)' }}>
                      #141414
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-muted)', fontWeight: 600 }}>
                      HIGH CONTRAST
                    </div>
                  </div>

                  {/* Signature Terracotta */}
                  <div style={{ padding: '1.25rem', borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#C84B31',
                        borderRadius: '8px',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      TERRACOTTA
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono-stack)', color: 'var(--color-paper-muted)' }}>
                      #C84B31
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                      SIGNATURE CTA
                    </div>
                  </div>

                  {/* Burnt Sienna Accent */}
                  <div style={{ padding: '1.25rem', borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#B83A24',
                        borderRadius: '8px',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      BURNT SIENNA
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono-stack)', color: 'var(--color-paper-muted)' }}>
                      #B83A24
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-muted)', fontWeight: 600 }}>
                      HOVER / FOCUS
                    </div>
                  </div>

                  {/* Neutral Border */}
                  <div style={{ padding: '1.25rem', borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#FAF8F5',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      NEUTRAL BORDER
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono-stack)', color: 'var(--color-paper-muted)' }}>
                      rgba(0,0,0,0.06)
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-muted)', fontWeight: 600 }}>
                      DIVIDERS
                    </div>
                  </div>

                  {/* Emerald Gate Admitted */}
                  <div style={{ padding: '1.25rem' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#2B8A3E',
                        borderRadius: '8px',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div className="meta-text-sm" style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      EMERALD
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono-stack)', color: 'var(--color-paper-muted)' }}>
                      #2B8A3E
                    </div>
                    <div className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                      GATE ADMITTED
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. STRICT TYPE HIERARCHY */}
              <section id="typography">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>SECTION 02</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-charcoal)', marginBottom: '0.4rem' }}>
                  Type Hierarchy &amp; Stacks
                </h2>
                <p style={{ color: 'var(--color-paper-80)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  A disciplined typographic system: Syne for display titles, Space Grotesk for body copy and headings,
                  and JetBrains Mono strictly for prices, seating tiers, timestamps, and ticket serial codes.
                </p>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '18px',
                    padding: '2rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.75rem',
                  }}
                >
                  <div>
                    <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>
                      72PX // H1 DISPLAY WIDE (SYNE)
                    </span>
                    <div
                      className="type-h1"
                      style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3rem)', color: 'var(--color-charcoal)', marginTop: '0.35rem' }}
                    >
                      Tonight in Hyderabad
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.04)', paddingTop: '1.25rem' }}>
                    <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>
                      44PX // H2 SECTION TITLE (SPACE GROTESK BOLD)
                    </span>
                    <div className="type-h2" style={{ color: 'var(--color-charcoal)', marginTop: '0.35rem', fontSize: '1.75rem' }}>
                      Selected Shows &amp; Headliners
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.04)', paddingTop: '1.25rem' }}>
                    <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>
                      28PX // H3 COMPONENT HEADING (SPACE GROTESK BOLD)
                    </span>
                    <div className="type-h3" style={{ color: 'var(--color-charcoal)', marginTop: '0.35rem', fontSize: '1.4rem' }}>
                      Echoes of Deccan: Fusion Music Festival 2026
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.04)', paddingTop: '1.25rem' }}>
                    <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>
                      20PX // H4 SUBHEADING (SPACE GROTESK BOLD)
                    </span>
                    <div className="type-h4" style={{ color: 'var(--color-charcoal)', marginTop: '0.35rem', fontSize: '1.15rem' }}>
                      General Admission &amp; VIP All-Access Tiers
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.04)', paddingTop: '1.25rem' }}>
                    <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>
                      16PX // BODY COPY (SPACE GROTESK, 80% CHARCOAL)
                    </span>
                    <p style={{ marginTop: '0.35rem', color: 'var(--color-paper-80)', lineHeight: 1.6, fontSize: '1rem' }}>
                      Standard body copy renders in clean sentence case with a comfortable line-height of
                      1.6 and clamped line length. Preserves editorial pacing and museum gallery legibility.
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.04)', paddingTop: '1.25rem' }}>
                    <span className="meta-label" style={{ color: 'var(--color-paper-muted)' }}>
                      14PX &amp; 12PX // METADATA &amp; PRICE (JETBRAINS MONO)
                    </span>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                      <span className="meta-text" style={{ color: 'var(--color-charcoal)', fontWeight: 600 }}>
                        SATURDAY, 24 OCT 2026
                      </span>
                      <span className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>
                        DOORS 18:00 IST
                      </span>
                      <span className="price-tag" style={{ color: 'var(--color-terracotta)', fontWeight: 800 }}>
                        ₹999
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono-stack)',
                          fontSize: '0.75rem',
                          color: 'var(--color-paper-muted)',
                        }}
                      >
                        SERIAL: PNP-HYD-DEC24
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. TICKET GEOMETRY & PERFORATION NOTCHES */}
              <section id="tickets">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>SECTION 03</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-charcoal)', marginBottom: '0.4rem' }}>
                  Ticket Geometry &amp; Perforations
                </h2>
                <p style={{ color: 'var(--color-paper-80)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Pure white card bodies with 18px rounded corners, delicate 1px warm borders, and vertical
                  perforated dividers that evoke classic physical box office admission stubs.
                </p>

                <div className="ticket-wrapper">
                  <div className="ticket-row" style={{ minHeight: '130px', backgroundColor: '#FFFFFF' }}>
                    <div className="ticket-body" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="meta-text-sm" style={{ color: 'var(--color-terracotta)', fontWeight: 700 }}>
                          HEADLINER PASS
                        </div>
                        <h3 style={{ fontSize: '1.35rem', marginTop: '0.25rem', color: 'var(--color-charcoal)' }}>
                          Deccan Symphony Live Pass
                        </h3>
                        <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)', marginTop: '0.25rem' }}>
                          HITEX Arena, Hyderabad • Tier 1 Entry
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="meta-text-sm" style={{ color: 'var(--color-paper-muted)' }}>ADMISSION</div>
                        <div className="price-tag" style={{ color: 'var(--color-terracotta)', fontSize: '1.75rem', fontWeight: 800 }}>
                          ₹1,499
                        </div>
                      </div>
                    </div>

                    <div className="ticket-perforation-v" aria-hidden="true" />

                    <div className="ticket-stub" style={{ width: '160px', justifyContent: 'center' }}>
                      <span className="stamp stamp-onsale">ON SALE</span>
                      <span className="meta-text-sm" style={{ fontSize: '0.7rem', color: 'var(--color-paper-muted)', marginTop: '0.35rem' }}>
                        PNP-DEMO-001
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. BUTTON ACTIONS */}
              <section id="buttons">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>SECTION 04</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-charcoal)', marginBottom: '0.4rem' }}>
                  Button Actions &amp; Micro-interactions
                </h2>
                <p style={{ color: 'var(--color-paper-80)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Tactile pill buttons (radius 9999px) with terracotta fill for primary actions, warm sandstone
                  borders for secondary actions, and ghost variants with smooth hover scaling.
                </p>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '18px',
                    padding: '2rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <button className="btn btn-cyan btn-pill">PRIMARY ACTION</button>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--color-paper-muted)' }}>
                      .btn-cyan.btn-pill
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-secondary btn-pill">SECONDARY ACTION</button>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--color-paper-muted)' }}>
                      .btn-secondary.btn-pill
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-ghost btn-pill">GHOST ACTION</button>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--color-paper-muted)' }}>
                      .btn-ghost.btn-pill
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-cyan btn-sm btn-pill">COMPACT PASS</button>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--color-paper-muted)' }}>
                      .btn-sm.btn-pill
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. STATUS BADGES & STAMPS */}
              <section id="stamps">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>SECTION 05</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-charcoal)', marginBottom: '0.4rem' }}>
                  Status Badges &amp; Curation Stamps
                </h2>
                <p style={{ color: 'var(--color-paper-80)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Clear, tactile status chips indicating live inventory, turnstile admission status, and sold-out states.
                </p>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '18px',
                    padding: '2rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    gap: '1.75rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span className="stamp stamp-onsale">ON SALE</span>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', color: 'var(--color-paper-muted)' }}>
                      .stamp-onsale
                    </div>
                  </div>
                  <div>
                    <span className="stamp stamp-admitted">GATE ADMITTED</span>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', color: 'var(--color-paper-muted)' }}>
                      .stamp-admitted
                    </div>
                  </div>
                  <div>
                    <span className="stamp stamp-void">SOLD OUT</span>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', color: 'var(--color-paper-muted)' }}>
                      .stamp-void
                    </div>
                  </div>
                  <div>
                    <span className="stamp stamp-headliner">HEADLINER PASS</span>
                    <div className="meta-text-sm" style={{ marginTop: '0.5rem', color: 'var(--color-paper-muted)' }}>
                      .stamp-headliner
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. FORM CONTROLS */}
              <section id="inputs">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="meta-label" style={{ color: 'var(--color-terracotta)' }}>SECTION 06</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-charcoal)', marginBottom: '0.4rem' }}>
                  Minimalist Form Controls
                </h2>
                <p style={{ color: 'var(--color-paper-80)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Inputs on warm #FAF8F5 surfaces with delicate 1px neutral borders (rgba(0, 0, 0, 0.1)) and terracotta focus rings.
                </p>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '18px',
                    padding: '2rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    maxWidth: '460px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  <div>
                    <label className="meta-label" style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--color-charcoal)' }}>
                      Attendee Full Name
                    </label>
                    <input
                      type="text"
                      className="input-box"
                      placeholder="e.g. Rishika Deshmukh"
                      defaultValue="Rishika Deshmukh"
                      style={{
                        backgroundColor: '#FAF8F5',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        color: 'var(--color-charcoal)',
                        width: '100%',
                      }}
                    />
                  </div>
                  <div>
                    <label className="meta-label" style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--color-charcoal)' }}>
                      Mobile Number (Pass Delivery)
                    </label>
                    <input
                      type="text"
                      className="input-box"
                      placeholder="+91 98765 43210"
                      defaultValue="+91 98765 43210"
                      style={{
                        backgroundColor: '#FAF8F5',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        color: 'var(--color-charcoal)',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

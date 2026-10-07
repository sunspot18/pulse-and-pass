'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiRequest } from '../lib/api';

export interface PromoSlide {
  id: string;
  title: string;
  slug?: string;
  category: string;
  statusBadge: string;
  badgeVariant: 'featured' | 'selling_fast' | 'early_bird' | 'limited';
  venueName: string;
  cityName: string;
  formattedDate: string;
  gateTime: string;
  priceInr: number;
  imageUrl: string;
  tagline?: string;
  description?: string;
  is_featured?: boolean;
}

// Fallback thematic banners by category if event has no banner_url
const CATEGORY_BANNERS: Record<string, string> = {
  music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=85',
  tech: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=85',
  conclave: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=85',
  classical: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1600&q=85',
  comedy: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85',
  arts: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1600&q=85',
  sports: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=85',
  default: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=85',
};

// Premium Curated Fallback Slides (guaranteed never blank during load or offline)
export const FALLBACK_PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    title: 'Echoes of Deccan: Fusion Music Festival 2026',
    slug: 'echoes-of-deccan-fusion-fest-2026',
    category: 'Music',
    statusBadge: '★ FEATURED HEADLINER',
    badgeVariant: 'featured',
    venueName: 'HITEX Exhibition Centre',
    cityName: 'Hyderabad',
    formattedDate: 'SAT, 14 NOV 2026',
    gateTime: '18:00 IST',
    priceInr: 1499,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=85',
    tagline: 'Carnatic prog-rock, electro-sufi synthesis & open-air midnight acoustics.',
    description: 'A three-stage sonic convergence of Carnatic prog-rock, electronic synthesis, and Sufi acoustic ensembles.',
    is_featured: true,
  },
  {
    id: 'e0000011-0000-0000-0000-000000000011',
    title: 'Mumbai Synthwave & Cyberpunk Gala',
    slug: 'mumbai-synthwave-cyberpunk-gala',
    category: 'Music',
    statusBadge: '⚡ SELLING FAST — 80% BOOKED',
    badgeVariant: 'selling_fast',
    venueName: 'Jio World Garden',
    cityName: 'Mumbai',
    formattedDate: 'SAT, 21 NOV 2026',
    gateTime: '17:00 IST',
    priceInr: 1299,
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=85',
    tagline: 'Neon visual projections, analog synthesizers, and retro-futuristic basslines.',
    description: 'Neon visual projections, analog synthesizers, and retro-futuristic basslines taking over Jio World Garden.',
    is_featured: true,
  },
  {
    id: 'e0000002-0000-0000-0000-000000000002',
    title: 'Full Stack Systems & WebTech Conclave',
    slug: 'full-stack-webtech-conclave-2026',
    category: 'Conclave',
    statusBadge: '🏷️ EARLY BIRD SPECIAL',
    badgeVariant: 'early_bird',
    venueName: 'Chowdiah Memorial Hall',
    cityName: 'Bengaluru',
    formattedDate: 'THU, 12 NOV 2026',
    gateTime: '09:00 IST',
    priceInr: 1499,
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=85',
    tagline: 'Systems architecture, concurrency internals, and high-throughput web engineering.',
    description: 'Deep dives into V8 optimizations, database isolation levels, and browser rendering engines.',
    is_featured: true,
  },
  {
    id: 'e0000016-0000-0000-0000-000000000016',
    title: 'Capital Soundwave: Electronic & Techno Arena',
    slug: 'capital-soundwave-techno-arena',
    category: 'Music',
    statusBadge: '★ EXCLUSIVE HEADLINER',
    badgeVariant: 'featured',
    venueName: 'JLN Stadium Arena',
    cityName: 'Delhi',
    formattedDate: 'FRI, 27 NOV 2026',
    gateTime: '16:00 IST',
    priceInr: 1899,
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=85',
    tagline: 'Twelve hours of warehouse industrial techno and modular synth soundscapes.',
    description: 'Twelve hours of relentless warehouse industrial techno and modular synthesizer soundscapes in JLN Stadium.',
    is_featured: true,
  },
];

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
  banner_url?: string | null;
  description?: string;
  venue?: {
    name?: string;
    city?: string;
  };
}

export function PromoCarousel() {
  const [slides, setSlides] = useState<PromoSlide[]>(FALLBACK_PROMO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch live events from GET /api/v1/events and prioritize is_featured
  useEffect(() => {
    let isCancelled = false;

    async function fetchLiveBanners() {
      try {
        const res = await apiRequest<{ events: ApiEventItem[] }>('/events?limit=25');
        if (!isCancelled && res.events && Array.isArray(res.events) && res.events.length > 0) {
          // Sort: is_featured === true first, then published marquee
          const sorted = [...res.events].sort((a, b) => {
            const aFeat = a.is_featured ? 1 : 0;
            const bFeat = b.is_featured ? 1 : 0;
            return bFeat - aFeat;
          });

          // Take top 4-5 events for the banner carousel
          const selected = sorted.slice(0, 5);

          const mapped: PromoSlide[] = selected.map((ev, idx) => {
            const startDate = new Date(ev.start_time);
            const dateStr = startDate.toLocaleDateString('en-US', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).toUpperCase();

            const gateStr = ev.doors_open_time
              ? new Date(ev.doors_open_time).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }) + ' IST'
              : '18:00 IST';

            // Determine thematic banner
            const catKey = ev.category.toLowerCase();
            const fallbackImg = CATEGORY_BANNERS[catKey] || CATEGORY_BANNERS.default || '';
            const banner = ev.banner_url && ev.banner_url.startsWith('http')
              ? ev.banner_url
              : fallbackImg;

            // Determine status badge
            let statusBadge = '★ FEATURED EVENT';
            let badgeVariant: PromoSlide['badgeVariant'] = 'featured';

            if (ev.is_featured) {
              statusBadge = idx === 0 ? '★ FEATURED HEADLINER' : '★ FEATURED EVENT';
              badgeVariant = 'featured';
            } else if (ev.is_sold_out) {
              statusBadge = '● FINAL TICKET RELEASE';
              badgeVariant = 'limited';
            } else if (idx % 2 === 0) {
              statusBadge = '⚡ SELLING FAST';
              badgeVariant = 'selling_fast';
            } else {
              statusBadge = '🏷️ EARLY BIRD SPECIAL';
              badgeVariant = 'early_bird';
            }

            return {
              id: ev.id,
              title: ev.title,
              slug: ev.slug,
              category: ev.category,
              statusBadge,
              badgeVariant,
              venueName: ev.venue?.name || 'Main Stage Arena',
              cityName: ev.venue?.city || 'Hyderabad',
              formattedDate: dateStr,
              gateTime: gateStr,
              priceInr: ev.min_price_paise ? Math.round(ev.min_price_paise / 100) : 999,
              imageUrl: banner,
              tagline: ev.description?.slice(0, 110) || 'Official box office admission manifest.',
              description: ev.description,
              is_featured: ev.is_featured,
            };
          });

          if (mapped.length > 0) {
            setSlides(mapped);
          }
        }
      } catch {
        // Retain fallback slides silently if offline or API error
      }
    }

    fetchLiveBanners();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Navigation handlers
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // 3. Auto-scroll interval every 5 seconds (5000ms), paused on hover or focus
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  // 4. Keyboard Navigation (Left / Right Arrow)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  // 5. Touch swipe gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? null;
    if (endX !== null) {
      const diff = touchStartX - endX;
      if (diff > 45) {
        // Swiped Left -> Next
        nextSlide();
      } else if (diff < -45) {
        // Swiped Right -> Prev
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  return (
    <section
      aria-label="Promotional Event Highlights & Headliners Carousel"
      style={{
        paddingTop: '1.25rem',
        paddingBottom: '0.75rem',
        position: 'relative',
      }}
    >
      <div className="container">
        {/* Main Carousel Surface Card */}
        <div
          ref={containerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured Events & Box Office Headliners"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            backgroundColor: '#1A1918',
            border: '1px solid rgba(20, 20, 20, 0.08)',
            borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(20, 20, 20, 0.08)',
            overflow: 'hidden',
            outline: 'none',
          }}
        >
          {/* Top Micro-Header Bar (Curated Box Office Rotation Ribbon) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 1.25rem',
              backgroundColor: 'rgba(26, 25, 24, 0.88)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              zIndex: 10,
              position: 'relative',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isPaused ? '#E59866' : 'var(--color-terracotta)',
                  boxShadow: `0 0 10px ${isPaused ? '#E59866' : 'var(--color-terracotta)'}`,
                }}
              />
              <span
                className="meta-text-sm"
                style={{ color: 'rgba(251, 249, 245, 0.8)', letterSpacing: '0.1em' }}
              >
                {isPaused ? 'CURATED SPOTLIGHT [PAUSED]' : 'FEATURED SEASON HEADLINERS'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                className="meta-text-sm"
                style={{
                  color: 'var(--color-terracotta)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                }}
              >
                CURATION {(currentIndex + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Sliding Slides Reel */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform',
            }}
          >
            {slides.map((slide, idx) => {
              const isCurrent = idx === currentIndex;

              // Distinct badge styles matching warm museum aesthetic
              let badgeBorder = 'rgba(200, 75, 49, 0.4)';
              let badgeColor = '#FFFFFF';
              let badgeBg = 'var(--color-terracotta)';

              if (slide.badgeVariant === 'selling_fast') {
                badgeBorder = 'rgba(230, 126, 34, 0.4)';
                badgeColor = '#FFFFFF';
                badgeBg = '#D35400';
              } else if (slide.badgeVariant === 'early_bird') {
                badgeBorder = 'rgba(43, 138, 62, 0.4)';
                badgeColor = '#FFFFFF';
                badgeBg = '#2B8A3E';
              }

              return (
                <div
                  key={slide.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${slides.length}: ${slide.title}`}
                  aria-hidden={!isCurrent}
                  style={{
                    minWidth: '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'stretch',
                    minHeight: 'clamp(380px, 46vw, 480px)',
                  }}
                >
                  {/* Background Visual Image with Layered Gradient Overlays */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${slide.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 30%',
                      zIndex: 1,
                    }}
                  />

                  {/* Curated Warm Editorial Overlays for Rich Contrast */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(90deg, rgba(26, 25, 24, 0.97) 0%, rgba(26, 25, 24, 0.88) 45%, rgba(26, 25, 24, 0.55) 75%, rgba(26, 25, 24, 0.8) 100%)',
                      zIndex: 2,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(26, 25, 24, 0.2) 0%, rgba(26, 25, 24, 0.95) 95%)',
                      zIndex: 3,
                    }}
                  />

                  {/* Slide Content Layout */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 5,
                      width: '100%',
                      padding: 'clamp(1.75rem, 4vw, 3rem)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1.25rem',
                    }}
                  >
                    {/* Top Row: Category + Status Badge + Metro */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.65rem',
                      }}
                    >
                      <span
                        className="badge-pill"
                        style={{
                          backgroundColor: badgeBg,
                          borderColor: badgeBorder,
                          color: badgeColor,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.08em',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        {slide.statusBadge}
                      </span>

                      <span
                        className="badge-pill"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                          borderColor: 'rgba(255, 255, 255, 0.18)',
                          color: '#FFFFFF',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {slide.category.toUpperCase()}
                      </span>

                      <span
                        className="meta-text-sm"
                        style={{
                          color: 'rgba(251, 249, 245, 0.7)',
                          marginLeft: 'auto',
                          letterSpacing: '0.1em',
                        }}
                      >
                        ARENA: {slide.cityName.toUpperCase()}
                      </span>
                    </div>

                    {/* Middle: Title & Tagline */}
                    <div style={{ maxWidth: '820px' }}>
                      <h2
                        style={{
                          fontFamily: 'var(--font-display-stack)',
                          fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                          lineHeight: 1.1,
                          fontWeight: 800,
                          color: '#FFFFFF',
                          textTransform: 'uppercase',
                          letterSpacing: '-0.02em',
                          marginBottom: '0.75rem',
                          textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        {slide.title}
                      </h2>

                      {slide.tagline && (
                        <p
                          style={{
                            color: 'rgba(251, 249, 245, 0.85)',
                            maxWidth: '680px',
                            marginBottom: '0',
                            fontSize: 'clamp(0.95rem, 1.3vw, 1.1rem)',
                            lineHeight: 1.55,
                          }}
                        >
                          {slide.tagline}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata & Direct CTA Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1.25rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      {/* Venue, Date & Price Details */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1.5rem',
                        }}
                      >
                        <div>
                          <div
                            className="meta-text-sm"
                            style={{ color: 'rgba(251, 249, 245, 0.6)', letterSpacing: '0.08em' }}
                          >
                            VENUE &amp; CITY
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-sans-stack)',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: '#FFFFFF',
                              marginTop: '0.2rem',
                            }}
                          >
                            📍 {slide.venueName}, {slide.cityName}
                          </div>
                        </div>

                        <div>
                          <div
                            className="meta-text-sm"
                            style={{ color: 'rgba(251, 249, 245, 0.6)', letterSpacing: '0.08em' }}
                          >
                            DATE &amp; GATES
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono-stack)',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: 'var(--color-terracotta)',
                              marginTop: '0.2rem',
                            }}
                          >
                            🗓️ {slide.formattedDate} • {slide.gateTime}
                          </div>
                        </div>

                        <div>
                          <div
                            className="meta-text-sm"
                            style={{ color: 'rgba(251, 249, 245, 0.6)', letterSpacing: '0.08em' }}
                          >
                            ADMISSION FROM
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono-stack)',
                              fontSize: '1.45rem',
                              fontWeight: 800,
                              color: '#FFFFFF',
                              marginTop: '0.15rem',
                            }}
                          >
                            ₹{slide.priceInr.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Direct CTA Link Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link
                          href={`/events/${slide.id}`}
                          className="btn btn-cyan"
                          id={`promo-book-btn-${slide.id}`}
                          style={{
                            padding: '0.75rem 1.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            borderRadius: '12px',
                          }}
                        >
                          Book Pass →
                        </Link>

                        <Link
                          href={`/events/${slide.id}`}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.8125rem',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left / Right Previous & Next Manual Controls */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            style={{
              position: 'absolute',
              top: '50%',
              left: '16px',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(26, 25, 24, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 12,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              fontSize: '1.25rem',
              transition: 'all var(--transition-tactile)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-terracotta)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(26, 25, 24, 0.8)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ‹
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            style={{
              position: 'absolute',
              top: '50%',
              right: '16px',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(26, 25, 24, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 12,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              fontSize: '1.25rem',
              transition: 'all var(--transition-tactile)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-terracotta)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(26, 25, 24, 0.8)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ›
          </button>

          {/* Indicator Dot Pills Bar */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'rgba(26, 25, 24, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              zIndex: 10,
            }}
          >
            {slides.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Jump to slide ${idx + 1}`}
                  aria-current={isActive}
                  style={{
                    height: '6px',
                    width: isActive ? '32px' : '10px',
                    backgroundColor: isActive ? 'var(--color-terracotta)' : 'rgba(255, 255, 255, 0.25)',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isActive ? '0 0 10px rgba(200, 75, 49, 0.5)' : 'none',
                    padding: 0,
                  }}
                />
              );
            })}
          </div>

          {/* 5-Second Linear Countdown Bar */}
          {!isPaused && (
            <div
              key={currentIndex}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                backgroundColor: 'var(--color-terracotta)',
                width: '100%',
                animation: 'countdownProgress 5000ms linear forwards',
                zIndex: 15,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* Global Style for Keyframe Countdown */}
      <style jsx>{`
        @keyframes countdownProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, initDb } from '../config/db.js';
import { fileURLToPath } from 'url';

export async function seedDatabase() {
  console.log('🌱  Seeding Pulse & Pass Box Office Database with Realistic Data...');
  await initDb();

  const client = await db.connect();

  try {
    // Ensure schema is applied before clearing and seeding
    const tableCheck = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    if (!tableCheck.rows[0]?.exists) {
      console.log('🔨  Schema missing before seed. Applying migrations first...');
      const { runMigrations } = await import('./migrate.js');
      await runMigrations();
    }

    await client.query('BEGIN');

    // 1. Clear existing seed data gracefully
    await client.query('DELETE FROM checkins;');
    await client.query('DELETE FROM tickets;');
    await client.query('DELETE FROM order_items;');
    await client.query('DELETE FROM orders;');
    await client.query('DELETE FROM reservations;');
    await client.query('DELETE FROM ticket_tiers;');
    await client.query('DELETE FROM events;');
    await client.query('DELETE FROM venues;');
    await client.query('DELETE FROM users;');

    console.log('🧹  Cleared existing database records.');

    // 2. Hash default passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassHash = await bcrypt.hash('Admin@PulsePass2026!', salt);
    const orgPassHash = await bcrypt.hash('Org@PulsePass2026!', salt);
    const attendeePassHash = await bcrypt.hash('User@PulsePass2026!', salt);

    // 3. Seed Users (1 Admin, 2 Organizers, 5 Attendees)
    const usersSql = `
      INSERT INTO users (id, email, password_hash, name, phone, role)
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'admin@pulsepass.dev', $1, 'Devendra Rathore', '9811122233', 'admin'),
        ('22222222-2222-2222-2222-222222222221', 'organizer.hyderabad@pulsepass.dev', $2, 'Tarun Reddy', '9849011223', 'organizer'),
        ('22222222-2222-2222-2222-222222222222', 'organizer.bengaluru@pulsepass.dev', $2, 'Sneha Rao', '9880199887', 'organizer'),
        ('33333333-3333-3333-3333-333333333331', 'rishika@pulsepass.dev', $3, 'Rishika Deshmukh', '9876543210', 'attendee'),
        ('33333333-3333-3333-3333-333333333332', 'aditya.sharma@pulsepass.dev', $3, 'Aditya Sharma', '9849012345', 'attendee'),
        ('33333333-3333-3333-3333-333333333333', 'priya.nair@pulsepass.dev', $3, 'Priya Nair', '9701234567', 'attendee'),
        ('33333333-3333-3333-3333-333333333334', 'karan.verma@pulsepass.dev', $3, 'Karan Verma', '9988776655', 'attendee'),
        ('33333333-3333-3333-3333-333333333335', 'ananya.kulkarni@pulsepass.dev', $3, 'Ananya Kulkarni', '9123456780', 'attendee')
      RETURNING id, email, role;
    `;
    const userRes = await client.query(usersSql, [adminPassHash, orgPassHash, attendeePassHash]);
    console.log(`👤  Seeded ${userRes.rowCount} authentic system users.`);

    // 4. Seed Venues across Hyderabad, Bengaluru, Mumbai, Delhi
    const venuesSql = `
      INSERT INTO venues (id, name, address, city, state, postal_code, capacity)
      VALUES
        ('a0000000-0000-0000-0000-000000000001', 'HITEX Exhibition Centre', 'Trade Fair Office Building, IZZAT Nagar', 'Hyderabad', 'Telangana', '500084', 12000),
        ('a0000000-0000-0000-0000-000000000002', 'Shilpakala Vedika', 'Hitech City Main Road, Madhapur', 'Hyderabad', 'Telangana', '500081', 2500),
        ('a0000000-0000-0000-0000-000000000003', 'Jayamahal Palace Grounds', 'Near Cantonment Railway Station, Nandi Durga Road', 'Bengaluru', 'Karnataka', '560046', 15000),
        ('a0000000-0000-0000-0000-000000000004', 'Chowdiah Memorial Hall', '16th Cross, G.D. Park Extension, Vyalikaval', 'Bengaluru', 'Karnataka', '560003', 1000),
        ('a0000000-0000-0000-0000-000000000005', 'Jio World Garden', 'Plot No: RG1A, G Block BKC, Bandra Kurla Complex', 'Mumbai', 'Maharashtra', '400051', 10000),
        ('a0000000-0000-0000-0000-000000000006', 'NCPA Tata Theatre', 'NCPA Marg, Nariman Point', 'Mumbai', 'Maharashtra', '400021', 1010),
        ('a0000000-0000-0000-0000-000000000007', 'Jawaharlal Nehru Stadium Arena', 'Pragati Vihar, Lodhi Road', 'Delhi', 'Delhi', '110003', 25000),
        ('a0000000-0000-0000-0000-000000000008', 'Siri Fort Auditorium', 'August Kranti Marg, Siri Institutional Area', 'Delhi', 'Delhi', '110049', 1865)
      RETURNING id, name, city;
    `;
    const venueRes = await client.query(venuesSql);
    console.log(`🏛️  Seeded ${venueRes.rowCount} premier venues across 4 cities.`);

    // 5. Seed 20 Realistic Events with Diverse States
    const eventsData = [
      // Hyderabad Events
      {
        id: 'e0000001-0000-0000-0000-000000000001',
        title: 'Echoes of Deccan: Fusion Music Festival 2026',
        slug: 'echoes-of-deccan-fusion-fest-2026',
        desc: 'A three-stage sonic convergence of Carnatic prog-rock, electronic synthesis, and Sufi acoustic ensembles under the Hyderabad night sky.',
        category: 'music',
        status: 'published',
        isFeatured: true,
        venueId: 'a0000000-0000-0000-0000-000000000001',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-11-14T17:00:00Z',
        endTime: '2026-11-14T23:30:00Z',
        doorsOpen: '2026-11-14T16:00:00Z',
        banner: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'General Admission', price: 149900, cap: 2000, sold: 480 },
          { name: 'VIP Pass (Stagefront)', price: 349900, cap: 300, sold: 120 },
          { name: 'Backstage Patron Pass', price: 699900, cap: 50, sold: 24 },
        ],
      },
      {
        id: 'e0000002-0000-0000-0000-000000000002',
        title: 'Deccan Tech Horizon Summit 2026',
        slug: 'deccan-tech-horizon-summit-2026',
        desc: 'The annual congregation of high-throughput distributed systems engineers, compiler designers, and decentralized network architects.',
        category: 'tech',
        status: 'published',
        isFeatured: true,
        venueId: 'a0000000-0000-0000-0000-000000000002',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-10-25T09:00:00Z',
        endTime: '2026-10-25T18:00:00Z',
        doorsOpen: '2026-10-25T08:00:00Z',
        banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Early Bird Delegate', price: 199900, cap: 500, sold: 500 }, // SOLD OUT TIER
          { name: 'Standard Delegate', price: 299900, cap: 1000, sold: 310 },
          { name: 'VIP Access & Dinner', price: 599900, cap: 150, sold: 45 },
        ],
      },
      {
        id: 'e0000003-0000-0000-0000-000000000003',
        title: 'Hyderabad Biryani & Kebab Heritage Carnival',
        slug: 'hyderabad-biryani-kebab-carnival',
        desc: 'Over 60 heritage Nizami kitchens present traditional dum pukht gastronomy, charcoal skewers, and artisanal Hyderabadi confections.',
        category: 'food',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000001',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-11-20T12:00:00Z',
        endTime: '2026-11-22T23:00:00Z',
        doorsOpen: '2026-11-20T11:30:00Z',
        banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Single Day Tasting Pass', price: 49900, cap: 3000, sold: 1250 },
          { name: 'Weekend Epicurean Pass', price: 99900, cap: 1000, sold: 610 },
        ],
      },
      {
        id: 'e0000004-0000-0000-0000-000000000004',
        title: 'Qawwali Nights at Chowmahalla Gate',
        slug: 'qawwali-nights-chowmahalla',
        desc: 'Sufi maestros Warsi Brothers deliver devotional verses and timeless ecstatic harmonies under the velvet Nizami sky.',
        category: 'arts',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000002',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-12-05T19:00:00Z',
        endTime: '2026-12-05T22:30:00Z',
        doorsOpen: '2026-12-05T18:00:00Z',
        banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Baithak Seating', price: 89900, cap: 800, sold: 800 }, // COMPLETELY SOLD OUT
          { name: 'Diwan Premium', price: 189900, cap: 200, sold: 200 }, // COMPLETELY SOLD OUT
        ],
      },
      {
        id: 'e0000005-0000-0000-0000-000000000005',
        title: 'Charminar Classical Kuchipudi Recital',
        slug: 'charminar-classical-kuchipudi',
        desc: 'Master dancers present mythological abhinaya and dynamic footwork patterns accompanied by mridangam and violin virtuosos.',
        category: 'arts',
        status: 'draft', // DRAFT EVENT
        venueId: 'a0000000-0000-0000-0000-000000000002',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-12-18T18:30:00Z',
        endTime: '2026-12-18T21:00:00Z',
        doorsOpen: '2026-12-18T18:00:00Z',
        banner: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Auditorium Seating', price: 49900, cap: 600, sold: 0 },
        ],
      },

      // Bengaluru Events
      {
        id: 'e0000006-0000-0000-0000-000000000006',
        title: 'Silicon Sounds: Bengaluru Indie Rock Showcase',
        slug: 'silicon-sounds-indie-showcase-2026',
        desc: 'Bengaluru iconic rock outfits and breakthrough bedroom producers share the historic open lawns of Jayamahal Palace.',
        category: 'music',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000003',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-11-28T16:00:00Z',
        endTime: '2026-11-28T23:00:00Z',
        doorsOpen: '2026-11-28T15:00:00Z',
        banner: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Lawn Standing', price: 99900, cap: 4000, sold: 1850 },
          { name: 'Front Pit Pass', price: 249900, cap: 600, sold: 340 },
          { name: 'VIP Lounge & Bar', price: 499900, cap: 100, sold: 88 },
        ],
      },
      {
        id: 'e0000007-0000-0000-0000-000000000007',
        title: 'Chowdiah Sitar Duet: Ragas at Twilight',
        slug: 'chowdiah-sitar-duet-twilight',
        desc: 'An intimate classical concert in the acoustic marvel of Chowdiah Hall celebrating monsoon and evening ragas.',
        category: 'arts',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000004',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-10-30T18:30:00Z',
        endTime: '2026-10-30T21:30:00Z',
        doorsOpen: '2026-10-30T17:45:00Z',
        banner: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Balcony Pass', price: 65000, cap: 350, sold: 280 },
          { name: 'Orchestra Front', price: 150000, cap: 250, sold: 190 },
        ],
      },
      {
        id: 'e0000008-0000-0000-0000-000000000008',
        title: 'Bengaluru Craft Brew & Fermentation Expo',
        slug: 'bengaluru-craft-brew-expo-2026',
        desc: 'Twenty-four microbreweries bring their barrel-aged stouts, mango sour ales, and smoked porters paired with artisanal cheese.',
        category: 'food',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000003',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-11-07T12:00:00Z',
        endTime: '2026-11-08T22:00:00Z',
        doorsOpen: '2026-11-07T11:30:00Z',
        banner: 'https://images.unsplash.com/photo-1538488881522-4326c3ccab76?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Brewer Tasting Glass & 5 Tokens', price: 120000, cap: 2500, sold: 980 },
          { name: 'All-Weekend Brewer Pass', price: 220000, cap: 800, sold: 410 },
        ],
      },
      {
        id: 'e0000009-0000-0000-0000-000000000009',
        title: 'Bengaluru Open Pro Badminton Cup 2026',
        slug: 'bengaluru-open-pro-badminton-2026',
        desc: 'Top national shuttlers compete in the fast-paced indoor finals of the Karnataka Invitational Cup.',
        category: 'sports',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000004',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-12-12T10:00:00Z',
        endTime: '2026-12-13T20:00:00Z',
        doorsOpen: '2026-12-12T09:00:00Z',
        banner: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Courtside Box', price: 180000, cap: 150, sold: 90 },
          { name: 'General Bleachers', price: 50000, cap: 600, sold: 340 },
        ],
      },
      {
        id: 'e0000010-0000-0000-0000-000000000010',
        title: 'Full Stack Systems & WebTech Conclave 2025',
        slug: 'full-stack-webtech-conclave-2025',
        desc: 'Deep dives into V8 optimizations, database isolation levels, and browser rendering engines.',
        category: 'tech',
        status: 'completed', // PAST COMPLETED EVENT
        venueId: 'a0000000-0000-0000-0000-000000000003',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2025-11-15T09:00:00Z',
        endTime: '2025-11-15T18:00:00Z',
        doorsOpen: '2025-11-15T08:30:00Z',
        banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Standard Ticket', price: 150000, cap: 800, sold: 800 },
        ],
      },

      // Mumbai Events
      {
        id: 'e0000011-0000-0000-0000-000000000011',
        title: 'Mumbai Synthwave & Cyberpunk Gala',
        slug: 'mumbai-synthwave-cyberpunk-gala',
        desc: 'Neon visual projections, analog synthesizers, and retro-futuristic basslines taking over Jio World Garden.',
        category: 'music',
        status: 'published',
        isFeatured: true,
        venueId: 'a0000000-0000-0000-0000-000000000005',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-11-21T18:00:00Z',
        endTime: '2026-11-22T01:00:00Z',
        doorsOpen: '2026-11-21T17:00:00Z',
        banner: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Cyber GA Pass', price: 129900, cap: 3000, sold: 1120 },
          { name: 'VIP Neon Deck', price: 349900, cap: 400, sold: 290 },
        ],
      },
      {
        id: 'e0000012-0000-0000-0000-000000000012',
        title: 'NCPA Symphony Orchestra of India Recital',
        slug: 'ncpa-soi-autumn-concert',
        desc: 'Beethoven 7th Symphony and Tchaikovsky Violin Concerto performed by the internationally acclaimed SOI under guest baton.',
        category: 'arts',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000006',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-10-28T19:00:00Z',
        endTime: '2026-10-28T21:45:00Z',
        doorsOpen: '2026-10-28T18:15:00Z',
        banner: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Dress Circle', price: 200000, cap: 300, sold: 295 },
          { name: 'Stalls Premium', price: 450000, cap: 250, sold: 250 }, // SOLD OUT
        ],
      },
      {
        id: 'e0000013-0000-0000-0000-000000000013',
        title: 'Bombay Coastal Seafood Fiesta',
        slug: 'bombay-coastal-seafood-fiesta',
        desc: 'Malvani prawns, butter-garlic crab, and Koli fish fry prepared fresh by generations-old fishing families along BKC.',
        category: 'food',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000005',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-11-13T12:00:00Z',
        endTime: '2026-11-15T22:30:00Z',
        doorsOpen: '2026-11-13T11:30:00Z',
        banner: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Entry + Welcome Platter', price: 79900, cap: 2000, sold: 840 },
          { name: 'Unlimited Catch Pass', price: 199900, cap: 500, sold: 320 },
        ],
      },
      {
        id: 'e0000014-0000-0000-0000-000000000014',
        title: 'Mumbai Midnight Marathon & 10K Run',
        slug: 'mumbai-midnight-marathon-2026',
        desc: 'The iconic nighttime endurance race through illuminated sea links and coastal boulevards.',
        category: 'sports',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000005',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-12-19T23:00:00Z',
        endTime: '2026-12-20T05:00:00Z',
        doorsOpen: '2026-12-19T21:30:00Z',
        banner: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: '10K Challenge Pass', price: 95000, cap: 2000, sold: 1400 },
          { name: 'Full Marathon 42K Entry', price: 165000, cap: 1000, sold: 610 },
        ],
      },
      {
        id: 'e0000015-0000-0000-0000-000000000015',
        title: 'Bollywood Retro Night: RD Burman Tribute',
        slug: 'bollywood-retro-rd-burman-tribute',
        desc: 'Brass sections, live rhythm ensembles, and vintage microphones bringing the 70s golden era back to life.',
        category: 'music',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000006',
        orgId: '22222222-2222-2222-2222-222222222221',
        startTime: '2026-11-06T19:30:00Z',
        endTime: '2026-11-06T22:30:00Z',
        doorsOpen: '2026-11-06T18:30:00Z',
        banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Balcony Classic', price: 99900, cap: 400, sold: 380 },
          { name: 'VIP Front Row', price: 299900, cap: 150, sold: 150 }, // SOLD OUT
        ],
      },

      // Delhi Events
      {
        id: 'e0000016-0000-0000-0000-000000000016',
        title: 'Capital Soundwave: Electronic & Techno Arena',
        slug: 'capital-soundwave-techno-arena',
        desc: 'Twelve hours of relentless warehouse industrial techno and modular synthesizer soundscapes in JLN Stadium.',
        category: 'music',
        status: 'published',
        isFeatured: true,
        venueId: 'a0000000-0000-0000-0000-000000000007',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-11-27T16:00:00Z',
        endTime: '2026-11-28T04:00:00Z',
        doorsOpen: '2026-11-27T15:00:00Z',
        banner: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Arena General Admission', price: 189900, cap: 5000, sold: 2200 },
          { name: 'Stage VIP Deck', price: 449900, cap: 800, sold: 510 },
        ],
      },
      {
        id: 'e0000017-0000-0000-0000-000000000017',
        title: 'Purani Dilli Street Food & Chaat Festival',
        slug: 'purani-dilli-street-food-festival',
        desc: 'Daulat ki chaat, stuffed parathas of Gali Paranthe Wali, and kulhad lassi curated by Old Delhi icons.',
        category: 'food',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000008',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-12-04T11:00:00Z',
        endTime: '2026-12-06T22:00:00Z',
        doorsOpen: '2026-12-04T10:30:00Z',
        banner: 'https://images.unsplash.com/photo-1505253758473-96b46deae27c?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Day Pass + 4 Food Coupons', price: 59900, cap: 2000, sold: 1100 },
          { name: 'VIP Priority Line Pass', price: 119900, cap: 400, sold: 290 },
        ],
      },
      {
        id: 'e0000018-0000-0000-0000-000000000018',
        title: 'India International Theatre Festival 2026',
        slug: 'india-intl-theatre-fest-2026',
        desc: 'Six premier experimental theatrical productions exploring existentialism, post-colonial history, and interactive monologue.',
        category: 'arts',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000008',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-12-10T17:30:00Z',
        endTime: '2026-12-14T22:00:00Z',
        doorsOpen: '2026-12-10T16:30:00Z',
        banner: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Balcony Seat', price: 75000, cap: 600, sold: 410 },
          { name: 'Front Orchestra', price: 180000, cap: 400, sold: 320 },
        ],
      },
      {
        id: 'e0000019-0000-0000-0000-000000000019',
        title: 'National Boxing Championship Bout 2026',
        slug: 'national-boxing-championship-2026',
        desc: 'Heavyweight and welterweight title fights featuring top military and state champion pugilists.',
        category: 'sports',
        status: 'published',
        venueId: 'a0000000-0000-0000-0000-000000000007',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-12-26T17:00:00Z',
        endTime: '2026-12-26T22:30:00Z',
        doorsOpen: '2026-12-26T16:00:00Z',
        banner: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'Ringside Row 1-3', price: 350000, cap: 100, sold: 85 },
          { name: 'Upper Bowl Bleachers', price: 80000, cap: 1500, sold: 920 },
        ],
      },
      {
        id: 'e0000020-0000-0000-0000-000000000020',
        title: 'Delhi Classical Ghazal Mehfil (Cancelled)',
        slug: 'delhi-classical-ghazal-mehfil-cancelled',
        desc: 'Poetic verses of Ghalib and Faiz Ahmed Faiz arranged for sitar, sarangi, and harmonium.',
        category: 'arts',
        status: 'cancelled', // CANCELLED EVENT
        venueId: 'a0000000-0000-0000-0000-000000000008',
        orgId: '22222222-2222-2222-2222-222222222222',
        startTime: '2026-10-18T19:00:00Z',
        endTime: '2026-10-18T22:00:00Z',
        doorsOpen: '2026-10-18T18:00:00Z',
        banner: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80',
        tiers: [
          { name: 'General Admission', price: 90000, cap: 500, sold: 0 },
        ],
      },
    ];

    let totalTiers = 0;
    const sampleEvent = eventsData[0]!;
    let sampleTierId = '';

    for (const ev of eventsData) {
      await client.query(
        `INSERT INTO events (id, organizer_id, venue_id, title, slug, description, category, status, start_time, end_time, doors_open_time, banner_url, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
        [
          ev.id,
          ev.orgId,
          ev.venueId,
          ev.title,
          ev.slug,
          ev.desc,
          ev.category,
          ev.status,
          ev.startTime,
          ev.endTime,
          ev.doorsOpen,
          ev.banner,
          Boolean((ev as { isFeatured?: boolean }).isFeatured),
        ],
      );

      for (const [i, tier] of ev.tiers.entries()) {
        const tierId = crypto.randomUUID();
        if (ev.id === sampleEvent.id && i === 0) {
          sampleTierId = tierId;
        }

        await client.query(
          `INSERT INTO ticket_tiers (id, event_id, name, price_paise, capacity, sold, sales_start, sales_end)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
          [
            tierId,
            ev.id,
            tier.name,
            tier.price,
            tier.cap,
            tier.sold,
            '2026-01-01T00:00:00Z',
            '2026-12-31T23:59:59Z',
          ],
        );
        totalTiers++;
      }
    }

    console.log(`🎟️  Seeded ${eventsData.length} events and ${totalTiers} ticket tiers.`);

    // 6. Seed a sample booked order and issued tickets for Attendee 1 (Rishika)
    const resId = '55555555-5555-5555-5555-555555555555';
    await client.query(
      `INSERT INTO reservations (id, user_id, tier_id, quantity, status, expires_at)
       VALUES ($1, $2, $3, 2, 'completed', NOW() + INTERVAL '1 hour');`,
      [resId, '33333333-3333-3333-3333-333333333331', sampleTierId],
    );

    // Order
    const orderId = '66666666-6666-6666-6666-666666666666';
    const orderNumber = 'PNP-2026-HYD8901';
    await client.query(
      `INSERT INTO orders (id, order_number, user_id, event_id, reservation_id, total_amount_paise, status, payment_method, payment_ref)
       VALUES ($1, $2, $3, $4, $5, 299800, 'confirmed', 'SIMULATED_UPI', 'UPI-REF-20261005-9988');`,
      [orderId, orderNumber, '33333333-3333-3333-3333-333333333331', sampleEvent.id, resId],
    );

    // Order Items
    const item1Id = '77777777-7777-7777-7777-777777777771';
    const item2Id = '77777777-7777-7777-7777-777777777772';
    await client.query(
      `INSERT INTO order_items (id, order_id, tier_id, attendee_name, attendee_email, attendee_phone, unit_price_paise)
       VALUES 
         ($1, $3, $4, 'Rishika Deshmukh', 'rishika@pulsepass.dev', '9876543210', 149900),
         ($2, $3, $4, 'Aarav Deshmukh', 'aarav.deshmukh@pulsepass.dev', '9876543211', 149900);`,
      [item1Id, item2Id, orderId, sampleTierId],
    );

    // Tickets
    const ticketCode1 = 'PNP-TK-8901-A1B2C3D4';
    const ticketCode2 = 'PNP-TK-8901-E5F6G7H8';
    await client.query(
      `INSERT INTO tickets (id, order_item_id, order_id, event_id, tier_id, ticket_code, security_hash, status)
       VALUES 
         ('88888888-8888-8888-8888-888888888881', $1, $3, $4, $5, $6, 'hash-sig-demo-01', 'valid'),
         ('88888888-8888-8888-8888-888888888882', $2, $3, $4, $5, $7, 'hash-sig-demo-02', 'valid');`,
      [item1Id, item2Id, orderId, sampleEvent.id, sampleTierId, ticketCode1, ticketCode2],
    );

    await client.query('COMMIT');

    // 7. Output Seeded Credentials Clearly to Console
    console.log('\n================================================================');
    console.log('🎫  PULSE & PASS SEED DATA INITIALIZED SUCCESSFULLY');
    console.log('================================================================');
    console.log('\n--- SEED USER CREDENTIALS ---');
    console.log('ROLE       | EMAIL                              | PASSWORD');
    console.log('----------------------------------------------------------------');
    console.log('Admin      | admin@pulsepass.dev                | Admin@PulsePass2026!');
    console.log('Organizer1 | organizer.hyderabad@pulsepass.dev  | Org@PulsePass2026!');
    console.log('Organizer2 | organizer.bengaluru@pulsepass.dev  | Org@PulsePass2026!');
    console.log('Attendee1  | rishika@pulsepass.dev              | User@PulsePass2026!');
    console.log('Attendee2  | aditya.sharma@pulsepass.dev        | User@PulsePass2026!');
    console.log('Attendee3  | priya.nair@pulsepass.dev           | User@PulsePass2026!');
    console.log('Attendee4  | karan.verma@pulsepass.dev          | User@PulsePass2026!');
    console.log('Attendee5  | ananya.kulkarni@pulsepass.dev      | User@PulsePass2026!');
    console.log('================================================================\n');

    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Direct CLI invocation
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}

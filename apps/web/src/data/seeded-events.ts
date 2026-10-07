export interface BoxOfficeEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  dayNumber: string;
  monthYear: string;
  dayOfWeek: string;
  venueName: string;
  cityName: string;
  gateTime: string;
  minPrice: number;
  currency: string;
  status: 'ON SALE' | 'FEW LEFT' | 'SOLD OUT';
  serialCode: string;
  isHeadliner?: boolean;
  is_featured?: boolean;
  description?: string;
  tierSummary?: string;
}

export const SEEDED_LINEUP: BoxOfficeEvent[] = [
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    title: 'Echoes of Deccan: Fusion Music Festival 2026',
    slug: 'echoes-of-deccan-fusion-2026',
    category: 'Music',
    dayNumber: '24',
    monthYear: 'OCT 2026',
    dayOfWeek: 'SATURDAY',
    venueName: 'HITEX Exhibition Centre',
    cityName: 'Hyderabad',
    gateTime: '18:00 IST',
    minPrice: 999,
    currency: 'INR',
    status: 'ON SALE',
    serialCode: 'PNP-HYD-DEC24',
    isHeadliner: true,
    description:
      'A premier night of classical Hindustani and Carnatic fusion with progressive electronica across two stages under the open sky.',
    tierSummary: 'General Admission (₹999) • VIP All-Access (₹2,499) • Fan Pit (₹3,999)',
  },
  {
    id: 'e0000002-0000-0000-0000-000000000002',
    title: 'Full Stack Systems & WebTech Conclave',
    slug: 'full-stack-webtech-conclave-2026',
    category: 'Conclave',
    dayNumber: '12',
    monthYear: 'NOV 2026',
    dayOfWeek: 'THURSDAY',
    venueName: 'Chowdiah Memorial Hall',
    cityName: 'Bengaluru',
    gateTime: '09:00 IST',
    minPrice: 1499,
    currency: 'INR',
    status: 'ON SALE',
    serialCode: 'PNP-BLR-FST12',
    description: 'High-scale systems engineering, database internals, and modern web architectures.',
    tierSummary: 'Delegate Pass (₹1,499) • VIP Executive (₹3,500)',
  },
  {
    id: 'e0000003-0000-0000-0000-000000000003',
    title: 'Indie Rock Night: The Midnight Voltage',
    slug: 'indie-rock-midnight-voltage',
    category: 'Music',
    dayNumber: '28',
    monthYear: 'NOV 2026',
    dayOfWeek: 'SATURDAY',
    venueName: 'Shilpakala Vedika',
    cityName: 'Hyderabad',
    gateTime: '19:30 IST',
    minPrice: 799,
    currency: 'INR',
    status: 'ON SALE',
    serialCode: 'PNP-HYD-IND28',
    description: 'Electrifying indie alt-rock showcasing 4 breakthrough regional bands.',
    tierSummary: 'Floor Standing (₹799) • Seated Balcony (₹1,299)',
  },
  {
    id: 'e0000004-0000-0000-0000-000000000004',
    title: 'Bombay Philharmonic: Acoustic Symphony',
    slug: 'bombay-philharmonic-acoustic-symphony',
    category: 'Classical',
    dayNumber: '05',
    monthYear: 'DEC 2026',
    dayOfWeek: 'SATURDAY',
    venueName: 'NCPA Tata Theatre',
    cityName: 'Mumbai',
    gateTime: '18:30 IST',
    minPrice: 1800,
    currency: 'INR',
    status: 'ON SALE',
    serialCode: 'PNP-BOM-SYM05',
    description: 'Full 60-piece orchestra performing classical and contemporary symphonic works.',
    tierSummary: 'Orchestra Front (₹1,800) • Royal Box (₹4,500)',
  },
  {
    id: 'e0000005-0000-0000-0000-000000000005',
    title: 'Standup Underground: The Laugh Circuit',
    slug: 'standup-underground-laugh-circuit',
    category: 'Comedy',
    dayNumber: '18',
    monthYear: 'DEC 2026',
    dayOfWeek: 'FRIDAY',
    venueName: 'Jio World Garden',
    cityName: 'Mumbai',
    gateTime: '20:00 IST',
    minPrice: 499,
    currency: 'INR',
    status: 'FEW LEFT',
    serialCode: 'PNP-BOM-STD18',
    description: 'An evening of unhinged observations and razor-sharp satire with 5 headliners.',
    tierSummary: 'General Access (₹499) • Front Rows (₹999)',
  },
  {
    id: 'e0000006-0000-0000-0000-000000000006',
    title: 'Deccan Classical Twilight Ragas',
    slug: 'deccan-classical-twilight-ragas',
    category: 'Classical',
    dayNumber: '09',
    monthYear: 'JAN 2027',
    dayOfWeek: 'SATURDAY',
    venueName: 'Jayamahal Palace Grounds',
    cityName: 'Bengaluru',
    gateTime: '17:30 IST',
    minPrice: 1200,
    currency: 'INR',
    status: 'SOLD OUT',
    serialCode: 'PNP-BLR-TWL09',
    description: 'Meditative evening ragas rendered by national Sangeet Natak Akademi maestros.',
    tierSummary: 'All seats sold out',
  },
];

/* ============================================================
   CONTENT — the only file you need to edit to change words,
   links, research projects and videos on the site.
   Anything marked  TODO  is a placeholder waiting for real info.
   ============================================================ */

export const PROFILE = {
  first: 'Khushal',
  last: 'Saini',
  roles: ['Electrical Engineering', 'Semiconductor Research', 'Film & Edit'],
  school: 'Arizona State University',
  email: 'khushalsaini9636@gmail.com',
  photo: 'assets/img/me',            // .webp + .jpg are both provided
  // Big statement under the hero. Wrap words in [[ ]] to turn them into a coloured chip.
  statement:
    'Half my week is spent on [[ultra-wide-bandgap]] semiconductors — materials built to survive the voltages and heat that would cook silicon. The other half is spent behind a [[camera]], cutting films for the people and communities building cool things.',
  // TODO: replace with your own words (2–3 sentences).
  bio: [
    'I study electrical engineering at Arizona State University, where I research ultra-wide-bandgap semiconductors — materials that can handle far more power, heat and voltage than silicon.',
    'When I’m not in the lab I’m behind a camera: shooting and cutting films for tech communities, hackathons and anyone with a story worth telling.',
  ],
  facts: [
    ['Based', 'Arizona'],
    ['Studying', 'Electrical Engineering @ ASU'],     // TODO confirm
    ['Research', 'Ultra-wide-bandgap semiconductors'], // TODO confirm
    ['Tools', 'TODO: e.g. COMSOL · Python · SEM · XRD'],
    ['Edit', 'Premiere Pro · After Effects · DaVinci Resolve'],
  ],
  socials: [
    { label: 'LinkedIn', short: 'in', url: 'https://linkedin.com/in/khushal-saini1' },
    { label: 'Instagram', short: 'ig', url: 'https://instagram.com/ks_digitaleye' },
    { label: 'YouTube', short: 'yt', url: 'https://youtube.com/@thegamer4life' },
    { label: 'GitHub', short: 'gh', url: 'https://github.com/khushalsainiEE' },
  ],
};

/* ---------- RESEARCH ----------
   Each project gets a numbered section and its own detail page.
   images: put files in assets/research/ and list them here.      */
export const RESEARCH = [
  {
    id: 'uwbg',
    title: 'Ultra-Wide-Bandgap Semiconductors',
    short: 'UWBG Research',
    year: '2025 — Now',
    tags: ['Materials', 'Power Electronics', 'Device Physics', 'Characterization'],
    lab: 'TODO: Lab name · Advisor name',
    summary:
      'TODO: One or two sentences on the question this research answers. (Waiting on files from the UWBG research project.)',
    findings: [
      'TODO: Key finding #1',
      'TODO: Key finding #2',
      'TODO: Key finding #3',
    ],
    poster: null,          // e.g. 'assets/research/uwbg-poster.webp'
    images: [],            // e.g. ['assets/research/fig1.webp', ...]
    links: [],             // e.g. [{ label: 'Poster PDF', url: 'assets/research/poster.pdf' }]
  },
  {
    id: 'project-2',
    title: 'TODO: Second research or lab project',
    short: 'Project Two',
    year: 'TODO',
    tags: ['TODO', 'Tags'],
    lab: 'TODO',
    summary: 'TODO: Short description.',
    findings: ['TODO'],
    poster: null,
    images: [],
    links: [],
  },
];

/* ---------- OTHER WORK (orgs, roles, builds) ---------- */
export const OTHER = [
  { org: 'DevLabs', role: 'Videographer & Editor', year: '2023 — Now', note: 'Org films, event coverage, promos and short-form.' },
  { org: 'HackerDevils @ ASU', role: 'Media Lead', year: '2023 — Now', note: 'Hackathon films and meeting branding.' }, // TODO role title
  { org: 'Freelance', role: 'Event Photography', year: '2022 — Now', note: 'Concerts, campus events and portraits.' },
];

/* ---------- FILM SIDE ----------
   type 'youtube' plays inside the site. 'external' opens a new tab.
   vertical: true for Shorts / Reels.                              */
export const SHOWREEL = { title: 'Showreel', year: '2025', type: 'youtube', url: 'https://youtu.be/YgXusYEIP94' };

export const FILMS = [
  { title: 'Team DevLabs', client: 'DevLabs', kind: 'Org Film', year: '2024', type: 'youtube', url: 'https://youtu.be/YgXusYEIP94', vertical: false,
    blurb: 'A portrait of the people behind DevLabs — shot, directed and edited end to end.' },
  { title: 'DevSpace', client: 'DevLabs', kind: 'Event Coverage', year: '2024', type: 'youtube', url: 'https://youtube.com/shorts/ibNgZQlYSCM', vertical: true,
    blurb: 'Fast-cut coverage of DevSpace, built for vertical feeds.' },
  { title: 'Marketing 101', client: 'DevLabs', kind: 'Promo', year: '2024', type: 'youtube', url: 'https://youtube.com/shorts/6kJu9nWQiTM', vertical: true,
    blurb: 'A punchy promo for a DevLabs workshop.' },
  { title: 'Recap in 25 Seconds', client: 'DevLabs', kind: 'Short Form', year: '2024', type: 'youtube', url: 'https://youtube.com/shorts/S3GYzalZgxQ', vertical: true,
    blurb: 'An entire event, compressed to twenty-five seconds.' },
  { title: 'Launch Into Learning', client: 'DevLabs', kind: 'Campaign', year: '2024', type: 'youtube', url: 'https://youtube.com/shorts/5VTnpdJkXJk', vertical: true,
    blurb: 'Campaign spot for a learning series launch.' },
  { title: 'Meetings Intro', client: 'HackerDevils @ ASU', kind: 'Branding', year: '2023', type: 'youtube', url: 'https://youtube.com/shorts/AO1VCFzFgeI', vertical: true,
    blurb: 'An intro sequence that opens every HackerDevils meeting.' },
  { title: 'Code-a-Thon', client: 'HackerDevils @ ASU', kind: 'Hackathon Film', year: '2023', type: 'youtube', url: 'https://youtube.com/shorts/O4KAkXnGlTs', vertical: true,
    blurb: 'Hype film for the HackerDevils Code-a-Thon.' },
  { title: 'Anime Edit', client: 'Personal', kind: 'Creative Edit', year: '2023', type: 'youtube', url: 'https://youtu.be/PI9cmjUz1-Q', vertical: false,
    blurb: 'A personal rhythm-driven edit.' },
  { title: 'True Love', client: 'Personal', kind: 'Featured Film', year: '2024', type: 'external', platform: 'Instagram', url: 'https://www.instagram.com/reel/C7ra5A1PWKy/', vertical: true,
    thumb: 'assets/img/event-devil-palooza-sm.webp', // TODO: replace with a still from the film
    blurb: 'A short film — opens on Instagram.' },
];

export const PHOTOS = [
  { src: 'assets/img/event-sparky', label: 'ASU Sparky' },
  { src: 'assets/img/event-hindu-yuva', label: 'Hindu Yuva ASU' },
  { src: 'assets/img/event-devil-palooza', label: 'Devil Palooza' },
];

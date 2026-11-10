/* ============================================================
   CONTENT — the only file you need to edit to change words,
   links, research projects and videos on the site.
   Images: give the path without the extension; .webp and .jpg are used.
   ============================================================ */

export const PROFILE = {
  first: 'Khushal',
  last: 'Saini',
  school: 'Arizona State University',
  email: 'khushalsaini9636@gmail.com',
  photo: 'assets/img/me',            // .webp + .jpg are both provided
  // Big statement under the hero. Wrap words in [[ ]] to turn them into a coloured chip.
  statement:
    'I design [[aluminum nitride]] diodes in simulation, built to be fast enough for radio and tough enough for high power. Away from the lab I work behind a [[camera]], shooting and cutting films for the communities around me.',
  bio: [
    'I’m an electrical engineering senior at Arizona State University and a TSMC FURI award recipient. In the Fu Research Group I research ultrawide-bandgap aluminum nitride Schottky diodes for radio-frequency use.',
    'My work combines Silvaco TCAD device simulation with cleanroom training at the ASU NanoFab. Before that I interned in industrial acceptance testing at AKAI and in RF network operations at Vodafone.',
    'Outside engineering I shoot and edit video for tech communities and campus events. That’s the other side of this site.',
  ],
  facts: [
    ['Based', 'Tempe, Arizona'],
    ['Studying', 'B.S.E. Electrical Engineering, minor in Business · ASU, 2023 — 2027'],
    ['Research', 'UWBG AlN RF Schottky diodes · Fu Research Group'],
    ['Award', 'TSMC FURI cohort'],
    ['Simulation', 'Silvaco TCAD · LTspice · MATLAB · Python'],
    ['Cleanroom', 'ASU NanoFab Class 100 · wet bench · DekTak · Filmetrics F20/F40 · Woollam VASE'],
    ['Hardware', 'ESP32 · Arduino · SystemVerilog · AutoCAD'],
  ],
  socials: [
    { label: 'LinkedIn', short: 'in', url: 'https://linkedin.com/in/khushal-saini1' },
    { label: 'Instagram', short: 'ig', url: 'https://instagram.com/ks_digitaleye' },
    { label: 'YouTube', short: 'yt', url: 'https://youtube.com/@thegamer4life' },
    { label: 'GitHub', short: 'gh', url: 'https://github.com/khushalsainiEE' },
  ],
};

/* ---------- RESEARCH ----------
   Each project gets a row on the page and its own detail page.
   Put images in assets/research/ (give the path without .webp/.jpg).  */
export const RESEARCH = [
  {
    id: 'aln-rf',
    title: 'Ultrawide-Bandgap Aluminum Nitride Diodes for High-Frequency Radio',
    short: 'AlN RF Diodes',
    year: 'Feb 2026 — Now',
    tags: ['UWBG', 'AlN', 'Schottky diodes', 'RF', 'Silvaco TCAD'],
    lab: 'Fu Research Group · ASU',
    mentor: 'Dr. Houqiang Fu, Assistant Professor',
    sponsor: 'TSMC · FURI',
    cover: 'assets/research/nanofab-metrology',
    coverCaption: 'Metrology suite training at the ASU NanoFab',
    question:
      'Can simulation-guided redesign turn an aluminum nitride (AlN) Schottky diode built for power electronics into one fast enough for radio-frequency use?',
    summary:
      '5G/6G and satellite links need diodes that are both fast and high-power. AlN has a 6.2 eV bandgap and a 12–15 MV/cm critical field, but the lab’s AlN diode was designed for power switching and reaches only 0.42 GHz. I rebuilt it in Silvaco TCAD and redesigned it step by step for RF.',
    stats: [
      { label: 'Cutoff frequency', value: '0.42 → 42.7 GHz', note: '~100× the lab’s diode' },
      { label: 'Junction capacitance', value: '2 pF → 2 fF', note: '~1000× smaller junction' },
      { label: 'Breakdown', value: '≥ 38 V', note: 'no breakdown observed; ~2× the GaN SBD' },
      { label: 'fc × breakdown', value: '~3×', note: 'vs published GaN and GaAs RF diodes' },
    ],
    sections: [
      {
        h: 'Why ultrawide bandgap',
        fig: 'assets/research/fig-uwbg-bandgap',
        figCaption: 'Breakdown field vs bandgap. AlN sits at the top of the curve.',
        points: [
          'UWBG materials have higher breakdown fields and lower leakage than Si, GaAs or GaN.',
          'AlN has roughly 5× GaN’s Johnson figure of merit, the measure that trades speed against voltage.',
        ],
      },
      {
        h: 'Method',
        points: [
          'Baseline: the lab’s AlN/AlGaN diode modelled in Silvaco TCAD on ASU’s Sol supercomputer.',
          'Calibration: matched to measured data, with resistance within ~25%.',
          'Redesign: AlN thickness and doping, anode shape and size.',
          'Evaluation: cutoff frequency from DC, AC and charge, plus a breakdown sweep.',
          'Stress tests: donor activation, contacts and field plates.',
        ],
      },
      {
        h: 'Final device',
        fig: 'assets/research/fig-device-design',
        figCaption: 'Cross-section and top view: 1.5 µm circular Ni/Au anode, ring cathode, 4.5 µm mesa.',
        points: [
          'A fully depleted 75 nm AlN layer acts as the capacitor’s dielectric, so the junction capacitance falls to about 2 fF.',
          'A 1.5 µm circular anode keeps the junction area small.',
          'An n⁺ AlGaN layer carries current sideways to a ring cathode.',
        ],
      },
      {
        h: 'Results',
        fig: 'assets/research/fig-fc-steps',
        figCaption: 'Forward cutoff frequency across seven design steps, from 0.42 GHz to 42.7 GHz (log scale).',
        fig2: 'assets/research/fig-iv-impedance',
        fig2Caption: '(a) I–V: no breakdown down to −37.8 V (19.5 pA). (b) Impedance: capacitive when off, ~1.6 kΩ when on.',
        points: [
          'Forward cutoff frequency stays within ~3% and junction capacitance within ~5% at only 10% donor activation.',
        ],
      },
    ],
    fabrication: [
      'Mesa etch down to the AlGaN layer',
      'Ti/Al/Ti ring cathode + anneal',
      'Ni/Au anode (Ø 1.5 µm) by lift-off',
      'SiO₂ deposition',
      'Air bridge and probe pads',
      'HF removal of the SiO₂ underneath',
    ],
    fabricationNote: 'The air bridge links the tiny anode to large probe pads while adding very little capacitance.',
    benchmark: {
      head: ['Device', 'fc (0 V)', 'Breakdown', 'fc × V'],
      rows: [
        ['GaAs SBD [1]', '1.3 THz', '10 V', '13 THz·V'],
        ['GaN SBD [2]', '0.59 THz', '18 V', '11 THz·V'],
        ['This work: AlN (simulated)', '0.95 THz', '≥ 38 V', '≥ 36 THz·V'],
      ],
      note: 'Zero-bias fc and breakdown of published RF diodes. This work is simulated and intrinsic; pads and transit time will lower measured fc.',
    },
    next: 'Fabricate the device and measure I–V, C–V and RF performance.',
    thanks: 'Thanks to Dr. Houqiang Fu and PhD mentor Bingcheng Da for mentorship and measured device data, and to ASU Research Computing (Sol), Silvaco and FURI.',
    poster: 'assets/research/furi-poster',
    pdf: 'assets/research/saini-furi-poster.pdf',
  },
];

/* ---------- PROJECTS ---------- */
export const PROJECTS = [
  {
    id: 'visionforce',
    title: 'VisionForce',
    subtitle: 'Edge-controlled electromagnetic system',
    event: 'StarHacks Hardware Hackathon',
    role: 'Embedded Systems Lead',
    year: 'Spring 2026',
    tags: ['ESP32-S3', 'Wi-Fi firmware', 'OpenCV', 'Power design'],
    points: [
      'Built the edge-controlled actuation system on an ESP32-S3 and wrote its Wi-Fi control firmware, linked to the team’s Python OpenCV target-tracking pipeline.',
      'Designed a dual-voltage power system: an LM2596 buck converter powers the ESP32, and a 5 V relay switches the electromagnet on a shared ground.',
    ],
    images: [],   // e.g. ['assets/projects/visionforce-1']
  },
  {
    id: 'cats',
    title: 'CATS',
    subtitle: 'Capstan Actuated Tilt System for jet engine inlet guide vanes',
    event: 'Devils Invent Hackathon',
    role: 'Hardware & Embedded Software Lead',
    year: 'Fall 2025',
    tags: ['Arduino', 'Servo control', '3D printing', 'Mechatronics'],
    points: [
      'Designed the electrical control system for a capstan mechanism that replaces the gear assembly in jet engine Variable Inlet Guide Vanes.',
      'Programmed Arduino code mapping input commands to servo positions that tilt the vanes.',
      'Built and tested a 3D-printed prototype. Team analysis projected a 94.5% mass reduction, 6.7× MTBF and 35% cost savings over gears.',
    ],
    images: [],
  },
];

/* ---------- EXPERIENCE ---------- */
export const EXPERIENCE = [
  { org: 'Fu Research Group, ASU', role: 'Undergraduate Researcher', year: 'Feb 2026 — Now',
    note: 'Simulating and optimizing AlN Schottky diodes in Silvaco TCAD for RF; NanoFab cleanroom, wet bench and metrology training; planning the fabrication and RF test run. Sponsored by TSMC (FURI).' },
  { org: 'AKAI · Adage Kanoo Analytical Industry', role: 'Electrical Engineering Intern', year: 'May — Jul 2026',
    note: 'Integrated factory acceptance testing, leak testing and root-cause analysis on gas chromatograph systems; 3D AutoCAD models for control systems; BOM and spec audits.' },
  { org: 'Vodafone', role: 'RF / Telecom Intern', year: 'Aug 2022',
    note: 'Shadowed engineers analyzing base station subsystem configurations, logging frequency allocation data and supporting network troubleshooting.' },
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
    thumb: 'assets/img/film-true-love-md.webp',   // a frame from the reel (0:27)
    blurb: 'A short film — opens on Instagram.' },
];

export const PHOTOS = [
  { src: 'assets/img/event-sparky', label: 'ASU Sparky' },
  { src: 'assets/img/event-hindu-yuva', label: 'Hindu Yuva ASU' },
  { src: 'assets/img/event-devil-palooza', label: 'Devil Palooza' },
];

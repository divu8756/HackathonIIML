/* ==========================================================================
   data.js — all event content and mock data in one place.

   Organisers: everything an edition changes (dates, prizes, tracks, schedule,
   sponsors, FAQ) lives here. Nothing in app.js needs touching to run 2027.

   When a real backend exists, the SEED_* objects below are what the API
   replaces — see api.js, which is the only file that talks to a server.
   ========================================================================== */

/* ---------------- Event ---------------- */
var EVENT = {
  name: "CodeStorm '26",
  tagline: 'Thirty-six hours. Three builders. One problem worth solving.',
  host: 'IIM Lucknow',
  campus: 'Noida Campus',
  datesLabel: '14–15 November 2026',
  venue: 'IIM Lucknow, Noida Campus',
  mode: 'In person · Teams of exactly 3',
  contact: 'codestorm@iiml.example',
  teamSize: 3,
  prizePool: 1000000,           // rupees — rendered as ₹10,00,000
  registrationFee: 0
};

/* Milestones drive the countdown, the schedule ribbon and the submission lock.
   Times are IST (+05:30). */
var MILESTONES = [
  { key: 'reg',    label: 'Registration closes', short: 'Reg closes', at: new Date('2026-11-01T23:59:00+05:30') },
  { key: 'start',  label: 'Hacking begins',      short: 'Kickoff',    at: new Date('2026-11-14T11:00:00+05:30') },
  { key: 'submit', label: 'Submissions close',   short: 'Submit',     at: new Date('2026-11-15T12:00:00+05:30') },
  { key: 'finals', label: 'Finals & awards',     short: 'Finals',     at: new Date('2026-11-15T16:30:00+05:30') }
];
var TIMELINE_START = new Date('2026-09-01T00:00:00+05:30').getTime();
function milestone(key) {
  for (var i = 0; i < MILESTONES.length; i++) if (MILESTONES[i].key === key) return MILESTONES[i];
  return null;
}
var REGISTRATION_CLOSE = milestone('reg').at;
var SUBMISSION_DEADLINE = milestone('submit').at;

/* ---------------- Prizes — must total EVENT.prizePool ---------------- */
var PRIZES = {
  podium: [
    { rank: 'Winner',           amount: 400000, medal: '🏆', note: 'Plus a fast-tracked interview loop with the title sponsor.', cls: 'first' },
    { rank: '1st Runner-up',    amount: 250000, medal: '🥈', note: 'Plus incubation office hours at the IIML Enterprise Incubation Centre.', cls: 'second' },
    { rank: '2nd Runner-up',    amount: 150000, medal: '🥉', note: 'Plus cloud credits worth ₹1,00,000 from the infrastructure partner.', cls: 'third' }
  ],
  special: [
    { name: 'Best in Track — Agentic AI',      amount: 50000 },
    { name: 'Best in Track — Fintech',         amount: 50000 },
    { name: 'Best in Track — Climate & Ops',   amount: 50000 },
    { name: 'Best Woman-led Team',             amount: 25000 },
    { name: 'Best First-year Team',            amount: 25000 }
  ]
};

/* ---------------- Tracks ---------------- */
var TRACKS = [
  {
    id: 'agentic',
    name: 'Agentic AI for Enterprise',
    icon: '🤖',
    blurb: 'Autonomous agents that do real back-office work — reconciliation, procurement, compliance review, support triage. Judges reward reliability over demo magic.',
    tags: ['LLM tooling', 'Workflow automation', 'Evals']
  },
  {
    id: 'fintech',
    name: 'Fintech & Financial Inclusion',
    icon: '🏦',
    blurb: 'Credit, payments and insurance for the next 400 million users. Think UPI rails, vernacular interfaces, thin-file underwriting and fraud defence.',
    tags: ['UPI / ONDC', 'Credit scoring', 'RegTech']
  },
  {
    id: 'climate',
    name: 'Climate & Sustainable Operations',
    icon: '🌱',
    blurb: 'Supply-chain emissions, energy scheduling, circular logistics. Bring a measurable tonne-of-CO₂ story, not a dashboard with a leaf on it.',
    tags: ['Scope 3', 'Optimisation', 'IoT telemetry']
  }
];

/* ---------------- Roles offered at registration ---------------- */
var ROLES = [
  'Team Lead', 'Frontend Engineer', 'Backend Engineer', 'Full-stack Engineer',
  'ML / Data Scientist', 'Product & Research', 'Designer (UI/UX)', 'Business & GTM'
];

/* ---------------- Schedule ---------------- */
var SCHEDULE = [
  {
    day: 'Day 0 · Fri 13 Nov',
    subtitle: 'Optional warm-up, online',
    items: [
      { t: '18:00', e: 'Platform walkthrough (online)', d: 'Coding Arena, submission portal and the judging rubric, explained live.', key: false },
      { t: '20:00', e: 'Team matchmaking room', d: 'Solo registrants and duos find their third member.', key: false }
    ]
  },
  {
    day: 'Day 1 · Sat 14 Nov',
    subtitle: 'Kickoff and the long build',
    items: [
      { t: '08:30', e: 'Check-in & breakfast', d: 'ID verification at the Noida campus gate. Bring your team ID.', key: false },
      { t: '10:00', e: 'Opening ceremony', d: 'Welcome from the Dean, sponsor keynotes, jury introduction.', key: false },
      { t: '11:00', e: 'Hacking begins', d: 'Problem statements unlock in the Coding Arena. The clock starts.', key: true },
      { t: '13:00', e: 'Lunch + mentor round 1', d: 'Forty mentors across the three tracks, 15 minutes per team.', key: false },
      { t: '17:00', e: 'Checkpoint demo', d: 'Two-minute progress check with a track mentor. Not scored.', key: false },
      { t: '20:00', e: 'Dinner & Arena sprint', d: 'Bonus arena challenges worth double points, open for two hours.', key: false },
      { t: '23:30', e: 'Midnight fuel', d: 'Chai, coffee and a very loud playlist.', key: false }
    ]
  },
  {
    day: 'Day 2 · Sun 15 Nov',
    subtitle: 'Ship, pitch, win',
    items: [
      { t: '08:00', e: 'Breakfast & mentor round 2', d: 'Last chance for feedback before the freeze.', key: false },
      { t: '12:00', e: 'Submissions close', d: 'Repository, deck and demo video locked. No extensions — the portal enforces it.', key: true },
      { t: '12:30', e: 'Expo round', d: 'Every team demos at their table. Jury and sponsors circulate.', key: false },
      { t: '14:30', e: 'Top 10 finals', d: 'Six-minute pitch, four-minute jury Q&A, on the main stage.', key: true },
      { t: '16:30', e: 'Awards & closing', d: 'Results, the ₹10,00,000 handover and a group photograph.', key: true }
    ]
  }
];

/* ---------------- Sponsors (placeholder brands — swap before go-live) ---------------- */
var SPONSORS = {
  title: [
    { name: 'Meridian Capital', logo: 'M', color: 'var(--gold)' }
  ],
  gold: [
    { name: 'Northwind Cloud', logo: 'NC', color: 'var(--violet)' },
    { name: 'Paysetu', logo: 'PS', color: 'var(--mint)' },
    { name: 'Orbit Analytics', logo: 'OA', color: 'var(--cyan)' }
  ],
  partners: [
    { name: 'Devfolio', logo: 'D', color: 'var(--violet-soft)' },
    { name: 'Kalyani Labs', logo: 'KL', color: 'var(--gold)' },
    { name: 'IIML EIC', logo: 'EIC', color: 'var(--mint)' },
    { name: 'StackRoute', logo: 'SR', color: 'var(--cyan)' },
    { name: 'Chai Point', logo: 'CP', color: 'var(--violet)' }
  ]
};

/* ---------------- FAQ ---------------- */
var FAQ = [
  { q: 'Who can participate?',
    a: 'Any student currently enrolled in a recognised undergraduate, postgraduate or diploma programme in India, plus anyone who graduated after June 2025. You do not need to be an IIM Lucknow student.' },
  { q: 'Does my team really have to be exactly three people?',
    a: 'Yes. Not two, not four. The registration form will not issue a team ID until all three members are filled in. If you are short a member, use the matchmaking room on Day 0 or the participant Discord.' },
  { q: 'Is there a registration fee?',
    a: 'No. Registration, meals, and workspace for the 36 hours are free. Travel and accommodation are your own responsibility, though we publish a list of partner hostels near the Noida campus.' },
  { q: 'Can we start building before the hackathon?',
    a: 'You may bring boilerplate, open-source libraries and any code you have publicly released before 14 November. The substantive work must be committed during the 25-hour window, and the jury will read your commit history.' },
  { q: 'What do we have to submit?',
    a: 'A public repository link, a demo video of up to three minutes, and a slide deck of at most ten slides. You can edit your submission as often as you like until the deadline at 12:00 on 15 November.' },
  { q: 'Can we use AI coding assistants?',
    a: 'Yes, and you should say so. Copilot, Claude, Cursor and friends are all allowed. Declare the tools you used in your submission notes — using them is not penalised, hiding them is.' },
  { q: 'How is judging done?',
    a: 'Five weighted criteria, scored by a jury of faculty, engineering leaders and investors. The full rubric is published on the Rules page before the event, not after it.' },
  { q: 'Who owns the intellectual property?',
    a: 'You do. Sponsors get a non-exclusive right to feature your project in event recaps, nothing more. Prize money comes with no equity attached.' },
  { q: 'When does the prize money reach us?',
    a: 'Within 30 working days of the closing ceremony, by bank transfer, split equally across the three members unless the team instructs otherwise in writing. TDS applies as per Indian law.' }
];

/* ---------------- Judging rubric ---------------- */
var RUBRIC = [
  { c: 'Problem & insight',     w: 20, d: 'Is this a real, sharply defined problem, and do you show evidence you understand it?' },
  { c: 'Technical execution',   w: 30, d: 'Does it work? Code quality, architecture, and how much of it was genuinely built in the window.' },
  { c: 'Impact & feasibility',  w: 20, d: 'Who benefits, how much, and what would it take to run this beyond a weekend.' },
  { c: 'Design & usability',    w: 15, d: 'Can a first-time user get value without a guided tour? Accessibility counts here.' },
  { c: 'Pitch & clarity',       w: 15, d: 'Six minutes, no jargon, a working demo rather than a slide about a working demo.' }
];

/* ---------------- Official problem statements (Coding Arena) ---------------- */
var PROBLEM_STATEMENTS = [
  { id: 'PS-01', track: 'Agentic AI for Enterprise', title: 'The three-way match that never sleeps',
    body: 'Invoices, purchase orders and goods-receipt notes disagree constantly. Build an agent that reconciles all three, explains every exception in plain language, and escalates only what a human must actually see.',
    partner: 'Meridian Capital' },
  { id: 'PS-02', track: 'Fintech & Financial Inclusion', title: 'Credit for the thin-file borrower',
    body: 'A kirana owner with two years of UPI history and no credit bureau record needs ₹2,00,000 of working capital. Design an underwriting flow that uses cash-flow data responsibly, and show how you avoid encoding bias.',
    partner: 'Paysetu' },
  { id: 'PS-03', track: 'Climate & Sustainable Operations', title: 'Scope 3 without the spreadsheet',
    body: 'A mid-sized manufacturer has 400 suppliers and no emissions data from any of them. Build the tool that estimates, collects and improves Scope 3 numbers well enough to survive an audit.',
    partner: 'Northwind Cloud' },
  { id: 'PS-04', track: 'Open', title: 'Wildcard',
    body: 'Bring your own problem. It must map to one of the three tracks at submission time, and you carry the extra burden of proving the problem is real.',
    partner: null }
];

var RESOURCES = [
  { ico: '📘', label: 'Starter kits & API keys', href: '#', note: 'Track-specific repos' },
  { ico: '🔑', label: 'Sponsor sandbox credentials', href: '#', note: 'Issued at check-in' },
  { ico: '📊', label: 'Open datasets for all tracks', href: '#', note: 'UPI, emissions, invoices' },
  { ico: '🧑‍🏫', label: 'Book a mentor slot', href: '#', note: '15-minute blocks' },
  { ico: '💬', label: 'Participant Discord', href: '#', note: 'Live support desk' }
];

/* ---------------- Arena practice challenges ---------------- */
var CHALLENGES = [
  { id: 'fizz', title: 'FizzBuzz Points', diff: 'easy', pts: 100, fn: 'fizzbuzz',
    desc: 'Return the FizzBuzz string for n: "Fizz" if divisible by 3, "Buzz" if by 5, "FizzBuzz" if both, else the number as a string.',
    starter: 'function fizzbuzz(n) {\n  // return "Fizz", "Buzz", "FizzBuzz", or String(n)\n  \n}',
    tests: [[[3], 'Fizz'], [[5], 'Buzz'], [[15], 'FizzBuzz'], [[7], '7'], [[30], 'FizzBuzz'], [[1], '1']] },
  { id: 'sum', title: 'Two-Sum Exists', diff: 'medium', pts: 150, fn: 'hasPair',
    desc: 'Given an array of numbers and a target, return true if any two distinct elements add up to the target, else false.',
    starter: 'function hasPair(nums, target) {\n  // return true if two distinct items sum to target\n  \n}',
    tests: [[[[2, 7, 11, 15], 9], true], [[[3, 2, 4], 6], true], [[[1, 2, 3], 7], false], [[[0, 4, 3, 0], 0], true], [[[5], 5], false]] },
  { id: 'rev', title: 'Reverse Words', diff: 'medium', pts: 150, fn: 'reverseWords',
    desc: 'Reverse the order of words in a sentence, collapsing extra spaces. "hello   world" becomes "world hello".',
    starter: 'function reverseWords(s) {\n  // reverse word order, single-space the result\n  \n}',
    tests: [[['the sky is blue'], 'blue is sky the'], [['  hello   world  '], 'world hello'], [['single'], 'single'], [['a b c'], 'c b a']] },
  { id: 'anag', title: 'Anagram Check', diff: 'hard', pts: 200, fn: 'isAnagram',
    desc: 'Return true if strings a and b are anagrams of each other (same letters, any order), else false.',
    starter: 'function isAnagram(a, b) {\n  // true if a and b are anagrams\n  \n}',
    tests: [[['listen', 'silent'], true], [['rat', 'car'], false], [['anagram', 'nagaram'], true], [['a', 'ab'], false], [['', ''], true]] },
  { id: 'ledger', title: 'Settle the Ledger', diff: 'hard', pts: 200, fn: 'settle',
    desc: 'Given [payer, payee, amount] entries, return the net balance per person as an object. Positive means they are owed money.',
    starter: 'function settle(entries) {\n  // entries: [["asha","raj",300], ...]\n  // return { asha: 300, raj: -300 }\n  \n}',
    tests: [
      [[[['asha', 'raj', 300]]], { asha: 300, raj: -300 }],
      [[[['a', 'b', 100], ['b', 'a', 40]]], { a: 60, b: -60 }],
      [[[]], {}]
    ] }
];

/* ==========================================================================
   MOCK DATASET
   Stands in for the organiser database. Every number below is fabricated for
   the demo; api.js is where these get swapped for real queries.
   ========================================================================== */

var SEED_TEAMS = [
  { team: 'Neural Ninjas',   college: 'IIM Lucknow',   track: 'agentic', pts: 420 },
  { team: 'ByteBandits',     college: 'IIM Lucknow',   track: 'fintech', pts: 360 },
  { team: 'StackSultans',    college: 'IIT Kanpur',    track: 'agentic', pts: 340 },
  { team: 'QuantumQuokkas',  college: 'IIM Lucknow',   track: 'climate', pts: 300 },
  { team: 'LogicLoop',       college: 'BITS Pilani',   track: 'fintech', pts: 280 },
  { team: 'DataDynamos',     college: 'IIT Delhi',     track: 'agentic', pts: 250 },
  { team: 'AgentAce',        college: 'IIM Lucknow',   track: 'agentic', pts: 230 },
  { team: 'PixelPirates',    college: 'NIT Trichy',    track: 'climate', pts: 190 },
  { team: 'ScopeThree',      college: 'IIT Bombay',    track: 'climate', pts: 175 },
  { team: 'RupeeRunners',    college: 'SRCC Delhi',    track: 'fintech', pts: 160 },
  { team: 'TensorTigers',    college: 'IIT Kanpur',    track: 'agentic', pts: 140 },
  { team: 'GreenGrid',       college: 'VIT Vellore',   track: 'climate', pts: 120 }
];

/* Cumulative team registrations, by date. */
var SEED_REGISTRATIONS = [
  ['22 Sep', 18], ['29 Sep', 47], ['06 Oct', 96], ['13 Oct', 158],
  ['20 Oct', 224], ['27 Oct', 291], ['01 Nov', 342]
];

/* Project submissions received per hour of the build window. */
var SEED_SUBMISSIONS_OVER_TIME = [
  ['Sat 12:00', 2], ['Sat 16:00', 5], ['Sat 20:00', 9], ['Sun 00:00', 14],
  ['Sun 04:00', 21], ['Sun 08:00', 46], ['Sun 10:00', 88], ['Sun 11:00', 127], ['Sun 12:00', 163]
];

/* Engagement: arena challenges solved per day of the run-up. */
var SEED_ENGAGEMENT = [
  ['Mon', 64], ['Tue', 88], ['Wed', 102], ['Thu', 96], ['Fri', 141], ['Sat', 268], ['Sun', 187]
];

var SEED_SUBMISSIONS_BY_TRACK = { agentic: 71, fintech: 54, climate: 38 };

var SEED_STATS = {
  teamsRegistered: 342,
  participants: 1026,
  colleges: 64,
  projectsSubmitted: 163,
  arenaSolves: 946,
  mentorSessions: 218,
  completionRate: 48,          // % of registered teams that submitted
  avgTeamPoints: 268
};

var SEED_ANNOUNCEMENTS = [
  { at: '15 Nov, 09:40', tag: 'urgent', text: 'Submissions close at 12:00 sharp. The portal locks itself — do not leave the video upload to the last ten minutes.' },
  { at: '15 Nov, 08:05', tag: 'info',   text: 'Mentor round 2 is live in Hall B. Walk-ins welcome until 10:00.' },
  { at: '14 Nov, 20:00', tag: 'info',   text: 'Double-points Arena sprint is open for the next two hours.' },
  { at: '14 Nov, 11:00', tag: 'urgent', text: 'Problem statements are unlocked. Hacking has officially begun — good luck.' },
  { at: '14 Nov, 08:30', tag: 'info',   text: 'Check-in is open at Gate 2. Carry a college ID along with your team ID.' }
];

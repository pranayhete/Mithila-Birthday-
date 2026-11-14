// ════════════════════════════════════════════════════════════════════════════
//  config.js — Everything editable lives here.
//  Lines marked [EDIT ME] are placeholders you should replace before sharing.
//  Never invent facts about Mithila; only add what you actually know.
// ════════════════════════════════════════════════════════════════════════════

const CONFIG = {

  // ── Names ──────────────────────────────────────────────────────────────────
  senderName:    'Pranay',
  recipientName: 'Mithila',

  // ── Birthday ───────────────────────────────────────────────────────────────
  // Format: 'YYYY-MM-DD'
  birthday: '2026-11-15',

  // Unlock time: null to open immediately, or ISO string in IST
  // e.g. '2026-11-15T00:00:00+05:30'
  unlockTime: null,

  // ── Music ──────────────────────────────────────────────────────────────────
  // null | '/assets/music.mp3' | 'https://youtu.be/VIDEOID'
  music: 'https://youtu.be/ko70cExuzZM',

  // ── Treat window ───────────────────────────────────────────────────────────
  treatWindowStart: '2026-11-16', // [EDIT ME] first date she can pick
  treatWindowEnd:   '2026-11-30', // [EDIT ME] last date she can pick

  timeSlotStart: '10:00',
  timeSlotEnd:   '21:00',

  // ── Treat options ──────────────────────────────────────────────────────────
  treatOptions: [
    { emoji: '☕', label: 'Coffee & dessert' },
    { emoji: '🍕', label: 'Pizza'            },
    { emoji: '🍦', label: 'Ice cream'        },
    { emoji: '🍽️', label: 'Dinner'          },
    { emoji: '🎂', label: 'Cake'             },
    { emoji: '🎁', label: 'Surprise me'      },
  ],

  // ── WhatsApp fallback ──────────────────────────────────────────────────────
  // Country code + number, no + or spaces. null to disable.
  whatsappNumber: null, // [EDIT ME] e.g. '919876543210'

  // ── Formspree endpoints ────────────────────────────────────────────────────
  // Create two forms at formspree.io → paste the full endpoint URLs here.
  // Your email lives ONLY in the Formspree dashboard, never in this file.
  formspreeGiftEndpoint:  'https://formspree.io/f/xdegapjl',
  formspreetreatEndpoint: 'https://formspree.io/f/xljbgokp',

  // ── Birthday message (scene 2, two lines) ──────────────────────────────────
  birthdayMessage: [
    'Nineteen looks really good on you.',                            // [EDIT ME]
    'Here\'s to a year that keeps up with how much you\'ve grown.', // [EDIT ME]
  ],

  // ── Ten compliments (scene 4) ───────────────────────────────────────────────
  // front: label shown face-up. back: the full compliment.
  // Keep them about character, never appearance.
  compliments: [
    {
      front: 'The energy you carry',
      back:  'You walk into a room and something shifts — not because you announce yourself, but because you\'re genuinely present. That\'s a rare thing.',
    },
    {
      front: 'That coffee order precision',
      back:  'You know exactly what you want, right down to the temperature and the milk ratio. That\'s a whole personality trait and honestly one of your best.',
    },
    {
      front: 'How you actually listen',
      back:  'You don\'t just wait for your turn to talk. You hear people. You remember things. That\'s rarer than it sounds.',
    },
    {
      front: 'Your sense of humour',
      back:  'Dry, quick, and perfectly timed. The kind that makes you think "wait, was that a joke?" and then collapse laughing.', // [EDIT ME]
    },
    {
      front: 'The way you care',
      back:  'You\'re the kind of person who notices when something is off. You don\'t make a big deal of it — you just show up.',
    },
    {
      front: 'Your taste',
      back:  'In music, in cafés, in how you put yourself together. It\'s consistent and it\'s entirely yours.',
    },
    {
      front: 'That you keep learning',
      back:  'You ask questions like someone who actually wants to understand — not just seem like they do. That\'s a good way to move through the world.',
    },
    {
      front: 'How you hold your ground',
      back:  'You\'re easy-going until something actually matters. Then you don\'t budge. That\'s the right way to pick your battles.',
    },
    {
      front: 'The small things you notice',
      back:  'You catch details that most people walk straight past. That\'s what makes you interesting to have a conversation with.',
    },
    {
      front: 'Everything about you',
      back:  'Pranay said to write "everything about her 😉🥰" — and honestly, that covers it.',
    },
  ],

  // ── Photo captions (scene 3) ───────────────────────────────────────────────
  // Exactly 5. Short, warm.
  photoCaptions: [
    'The café era. This is her natural habitat.',     // [EDIT ME]
    'Gold sequin, warm light. She knew the assignment.',
    'Rust and jasmine. November in full colour.',
    'Rooftop night. The bow-on-the-shoulder detail.',
    'Lamp-lit, rooftop, completely unbothered.',
  ],

  // Photo file names — place WebP files in /assets/photos/
  photos: [
    { file: 'photo1.webp', alt: 'Mithila at a plant-filled café in a black-and-white check top'           },
    { file: 'photo2.webp', alt: 'Mithila in a gold sequin top in warm hotel-bathroom light'               },
    { file: 'photo3.webp', alt: 'Mithila in a rust-red embroidered kurta, with jasmine flowers and a swan'},
    { file: 'photo4.webp', alt: 'Mithila on a rooftop at night in a black bow-shoulder dress'             },
    { file: 'photo5.webp', alt: 'Mithila at a lamp-lit rooftop lounge in a black outfit'                  },
  ],

  // ── Quiz questions (scene 5) ───────────────────────────────────────────────
  quizQuestions: [
    {
      q:        'Who\'s more likely to order a second coffee when they said they wouldn\'t?',
      meReact:  '😇 Obviously not me. I have complete self-control.',
      youReact: '☕ The coffee already knew before you decided.',
    },
    {
      q:        'Who\'s more likely to be late because they couldn\'t decide what to wear?',
      meReact:  '😬 Okay, fine. It was me. It\'s always me.',
      youReact: '👑 Worth every minute of the wait.',
    },
    {
      q:        'Who\'s more likely to screenshot a meme and then forget to actually send it?',
      meReact:  '📱 My camera roll is a graveyard of unsent memes.',
      youReact: '🤌 You\'ve got an entire private archive in there, haven\'t you.',
    },
    {
      q:        'Who\'s more likely to have a hot take that turns out to be correct?',
      meReact:  '🎲 I stand by it even when I\'m wrong. Especially then.',
      youReact: '🔮 You just knew. You always just know.',
    },
    {
      q:        'Who\'s more likely to change the plan at the last minute and have it work out anyway?',
      meReact:  '🗺️ The original plan was just a starting suggestion.',
      youReact: '✨ Spontaneity is a skill and you have genuinely mastered it.',
    },
  ],

  // Quiz verdicts (one is picked at random at the end)
  quizVerdicts: [
    'Verdict: a chaotic-good duo with excellent coffee taste and no regrets.',  // [EDIT ME]
    'Verdict: somehow you both win every round. Deeply suspicious.',           // [EDIT ME]
    'Verdict: this was extremely accurate and slightly concerning.',            // [EDIT ME]
  ],

  // ── The letter (scene 6) ───────────────────────────────────────────────────
  // Each string is one line. Use '' for a blank line between paragraphs.
  letter: [
    'Hey Mithila,',
    '',
    'I didn\'t know what to write here for a while.',                          // [EDIT ME]
    'Then I figured — just say the actual thing.',
    '',
    'You\'re one of those people who makes whatever\'s happening',              // [EDIT ME]
    'feel like it matters. I don\'t fully know how you do that,',
    'but it\'s a good thing to have around.',
    '',
    'Nineteen suits you.',
    'I hope this year gives you everything you\'re working towards,',          // [EDIT ME]
    'and a few things you weren\'t expecting.',
    '',
    'Happy birthday.',
    '',
    '— Pranay',
  ],

  // ── Open Graph ─────────────────────────────────────────────────────────────
  ogTitle:       'A little something for you',
  ogDescription: 'Someone made you something. Open it.',
  ogImage:       null, // Absolute URL after deployment, or null to skip

};

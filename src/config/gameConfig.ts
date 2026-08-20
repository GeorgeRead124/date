/**
 * ============================================================
 *  GAME CONFIG — THE ONLY FILE YOU SHOULD NEED TO EDIT
 * ============================================================
 * Change names, dates, questions, narration and captions here.
 * Everything else in the app reads from this file.
 */

export interface Question {
  prompt: string;
  /** Any of these answers (lowercase, trimmed) will be accepted */
  acceptedAnswers: string[];
  crystalColor: string; // hex color for the crystal that lights up
}

export interface Photo {
  src: string; // path relative to /public, e.g. "/images/photo1.jpg"
  caption: string;
}

export const gameConfig = {
  // ---- People ----
  girlfriendName: "Nour",
  myName: "George",

  // ---- The Date ----
  date: {
    date: "August 21, 2026",
    time: "7:30 PM",
    location: "Our favorite rooftop spot",
  },

  // ---- Level 1: The Map ----
  mapLocations: [
    { id: "forest", label: "FOREST", correct: false },
    { id: "ocean", label: "OCEAN", correct: false },
    { id: "city", label: "CITY", correct: true },
    { id: "castle", label: "CASTLE", correct: false },
  ],

  // ---- Level 2: The Object ----
  tableObjects: [
    { id: "shoes", label: "Shoes", correct: false },
    { id: "phone", label: "Phone", correct: false },
    { id: "bag", label: "Bag", correct: false },
    { id: "umbrella", label: "Umbrella", correct: false },
    { id: "heart", label: "Heart", correct: true },
  ],

  // ---- Voice Puzzle ----
  voicePuzzle: {
    question: "Tell me who you think is behind all of this.",
    acceptedAnswers: ["george", "my boyfriend", "you", "boyfriend", "him"],
  },

  // ---- Level 3: The Crystal Chest — fully customizable questions ----
  questions: [
    {
      prompt: "What is something I always do when I'm nervous?",
      acceptedAnswers: ["bite my nails", "tap my leg", "ramble"],
      crystalColor: "#4da6ff", // blue
    },
    {
      prompt: "What is something we always end up talking about?",
      acceptedAnswers: ["food", "movies", "the future"],
      crystalColor: "#ffcf4d", // gold
    },
    {
      prompt: "What is one of your favorite memories with me?",
      acceptedAnswers: ["the beach", "our first date", "the trip"],
      crystalColor: "#ff6fae", // pink
    },
  ] as Question[],

  // ---- Narration lines (used for on-screen text + speech synthesis fallback) ----
  narration: {
    intro1: "Hey, {girlfriendName}...",
    intro2: "I found something that belongs to you.",
    intro3: "But you're going to have to find it.",
    level1: "Every adventure has to begin somewhere. Where do you think ours begins?",
    level1Wrong: ["Hmm...", "Nice guess.", "But no."],
    level2: "You're going to need a few things. But there's one thing you absolutely cannot forget.",
    level2Correct: "Correct. Although technically... I was hoping you'd bring that smile yourself.",
    level3Intro: "Only someone who knows you can open this.",
    level3Ready: "Are you ready?",
    chestEmpty1: "Oh...",
    chestEmpty2: "Looks like someone already took the treasure.",
    chestEmpty3: "Maybe you should follow the light.",
    pathWords: ["I", "WANT", "TO", "SEE", "YOU", "TOMORROW."],
    finalIntro1: "You've made it this far.",
    finalIntro2: "Are you ready?",
    finalMessage1: "Okay...",
    finalMessage2: "This wasn't really a treasure hunt.",
    finalMessage3: "I just wanted an excuse to make something for you.",
    gallerySignoff: "See you tomorrow ❤️",
  },

  // ---- Voice files (drop real recordings here later; falls back to speech synthesis) ----
  audioFiles: {
    ambient: "/audio/ambient.mp3",
    intro: "/audio/intro.mp3",
    level1: "/audio/level1.mp3",
    level2: "/audio/level2.mp3",
    level3: "/audio/level3.mp3",
    almostThere: "/audio/almost-there.mp3",
    final: "/audio/final.mp3",
    chime: "/audio/chime.mp3",
    whoosh: "/audio/whoosh.mp3",
  },

  // ---- Memory Gallery ----
  photos: [
    { src: "/images/photo1.jpg", caption: "That day at the beach" },
    { src: "/images/photo2.jpg", caption: "Our first trip together" },
    { src: "/images/photo3.jpg", caption: "The night we stayed up talking" },
    { src: "/images/photo4.jpg", caption: "Your favorite coffee spot" },
    { src: "/images/photo5.jpg", caption: "The silly selfie you hate" },
  ] as Photo[],

  // ---- Easter eggs ----
  easterEggs: {
    moon: "Why are you clicking the moon?",
    rock1: "Seriously?",
    rock2: "There's nothing here 😂",
    hiddenFound: "You found me.",
    hiddenReveal: "Unfortunately, I'm not the treasure.",
  },
};

export type GameConfig = typeof gameConfig;

/** Replace {girlfriendName} / {myName} tokens in a narration string */
export function fillTemplate(text: string): string {
  return text
    .replace(/{girlfriendName}/g, gameConfig.girlfriendName)
    .replace(/{myName}/g, gameConfig.myName);
}

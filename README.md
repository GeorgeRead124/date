# The Secret Treasure 💛

A cinematic 3D interactive treasure hunt, built with React + Vite + Three.js
(react-three-fiber) + GSAP/Framer Motion. The "treasure" at the end is a date.

## 1. Run it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

To build a shareable static version:

```bash
npm run build
npm run preview
```

The `dist/` folder from `npm run build` can be deployed anywhere static
(Vercel, Netlify, GitHub Pages, etc.) if you want to send her a link instead
of running it locally.

## 2. Everything you'll want to customize lives in ONE file

**`src/config/gameConfig.ts`**

Open it and edit:

- `girlfriendName` / `myName`
- `date.date`, `date.time`, `date.location` — the final reveal
- `mapLocations` — which of the 4 map markers is the "correct" one (Level 1)
- `tableObjects` — which object on the table is correct (Level 2 — currently "heart")
- `voicePuzzle` — the optional voice-recognition question + accepted answers
- `questions` — the **3 personalized crystal questions** for the cave chest,
  each with its own list of accepted answers and crystal color
- `narration` — every line of on-screen/spoken text
- `photos` — captions + file paths for the memory gallery at the end

You will not need to touch any other file for basic customization.

## 3. Adding photos

Drop up to 5 images into `public/images/` named exactly:

```
photo1.jpg
photo2.jpg
photo3.jpg
photo4.jpg
photo5.jpg
```

(To use more/fewer or rename them, edit the `photos` array in `gameConfig.ts`
— just point `src` at wherever you put the file in `public/`.)

If a photo is missing, the gallery gracefully shows an elegant placeholder
frame instead of a broken image — nothing crashes.

## 4. Adding your voice

Drop mp3 recordings into `public/audio/` named exactly:

```
intro.mp3
level1.mp3
level2.mp3
level3.mp3
almost-there.mp3
final.mp3
ambient.mp3   (optional quiet background music)
```

If a file is missing or fails to load, the app automatically falls back to
the browser's built-in speech synthesis, so the experience always has a
voice even before you add recordings. A simple phone voice memo works great
— it doesn't need to be studio quality, it just needs to be you.

## 5. Customizing the 3 cave questions

In `gameConfig.ts`, the `questions` array has exactly this shape:

```ts
{
  prompt: "What is something I always do when I'm nervous?",
  acceptedAnswers: ["bite my nails", "tap my leg", "ramble"],
  crystalColor: "#4da6ff",
}
```

Add as many accepted answers/synonyms as you like — the check is a loose
"contains" match, case-insensitive, so she doesn't need to type it exactly.

## 6. How the experience flows

1. **Intro** — dark screen, lantern, parchment note, "Begin the Hunt"
2. **Level 1 — The Map** — she picks the right location on a 3D floating map
3. **Level 2 — The Object** — she picks the right item on a table (the heart),
   then an optional voice/text puzzle ("who's behind this?")
4. **Level 3 — The Crystal Chest** — 3 personal questions light 3 crystals,
   then she opens the chest
5. **The twist** — the chest is empty; a portal appears
6. **Follow the Light** — a glowing path reveals the message
   "I WANT TO SEE YOU TOMORROW."
7. **The Reveal** — she opens the final chest: "A DATE WITH [YOU] ❤️" plus
   date/time/location
8. **One more thing** — a personal message + 3D memory photo gallery

## 7. Notes

- Works on desktop and mobile (touch drag / gyroscope where available).
- Nothing autoplays audio without a user gesture (browser policy compliant);
  there's a graceful "Continue without sound" option on the intro screen.
- Reduced-motion is respected automatically via `prefers-reduced-motion`.
- No external image/font CDNs are required to run it besides Google Fonts
  (loaded via `@import` in `src/styles/globals.css`) — everything 3D is
  generated procedurally, so there's nothing to break if you never add
  photos or audio.

Have fun. 💛

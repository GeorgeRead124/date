import { createContext, useContext } from "react";

export type Phase =
  | "intro"
  | "map"
  | "mapTransition"
  | "room"
  | "voice"
  | "cave"
  | "chestEmpty"
  | "portal"
  | "path"
  | "finalChest"
  | "reveal"
  | "gallery";

export const PHASE_ORDER: Phase[] = [
  "intro",
  "map",
  "mapTransition",
  "room",
  "voice",
  "cave",
  "chestEmpty",
  "portal",
  "path",
  "finalChest",
  "reveal",
  "gallery",
];

export function progressForPhase(phase: Phase): number {
  const idx = PHASE_ORDER.indexOf(phase);
  return Math.round(((idx + 1) / PHASE_ORDER.length) * 100);
}

export interface GameContextValue {
  phase: Phase;
  setPhase: (p: Phase) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (r: boolean) => void;
  crystalsLit: [boolean, boolean, boolean];
  setCrystalLit: (index: number, lit: boolean) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

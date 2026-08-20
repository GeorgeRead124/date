/**
 * AudioManager
 * -------------------------------------------------------------
 * Handles:
 *  - ambient background bed (loops, very quiet)
 *  - narration lines: tries to play a real .mp3 file from
 *    /public/audio/, and gracefully falls back to
 *    window.speechSynthesis if the file is missing/blocked.
 *  - short one-shot SFX (chime, whoosh, hover, click) using
 *    the Web Audio API oscillator synthesis, so it works with
 *    zero asset files out of the box.
 */

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private ambientEl: HTMLAudioElement | null = null;
  private muted = false;
  private unlocked = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
    }
    return this.ctx;
  }

  /** Call this on first user gesture to unlock audio on mobile/Safari */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      const ctx = this.getCtx();
      if (ctx.state === "suspended") ctx.resume();
    } catch {
      /* ignore */
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ambientEl) this.ambientEl.volume = m ? 0 : 0.12;
  }

  /** Soft synthesized ambient pad — used if no ambient.mp3 exists */
  startAmbient(src?: string) {
    if (this.muted) return;
    if (src) {
      const el = new Audio(src);
      el.loop = true;
      el.volume = 0.12;
      el.play().catch(() => {
        /* file missing or blocked — silently ignore, synth pad is optional ambiance */
      });
      this.ambientEl = el;
    }
  }

  stopAmbient() {
    this.ambientEl?.pause();
    this.ambientEl = null;
  }

  /** Play a short synthesized chime / whoosh / hover tick */
  playTone(kind: "hover" | "click" | "chime" | "whoosh" | "burst") {
    if (this.muted) return;
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      switch (kind) {
        case "hover":
          osc.type = "sine";
          osc.frequency.setValueAtTime(660, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        case "click":
          osc.type = "triangle";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        case "chime": {
          const freqs = [523.25, 659.25, 783.99];
          freqs.forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.value = f;
            o.connect(g);
            g.connect(ctx.destination);
            const t = now + i * 0.12;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
            o.start(t);
            o.stop(t + 1.2);
          });
          break;
        }
        case "whoosh":
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.04, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
          osc.start(now);
          osc.stop(now + 0.6);
          break;
        case "burst": {
          for (let i = 0; i < 5; i++) {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.value = 400 + Math.random() * 600;
            o.connect(g);
            g.connect(ctx.destination);
            const t = now + Math.random() * 0.3;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.06, t + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
            o.start(t);
            o.stop(t + 0.55);
          }
          break;
        }
      }
    } catch {
      /* audio not available — fail silently */
    }
  }

  /**
   * Speak a narration line. Tries the mp3 file first; if it fails to
   * load/play (e.g. placeholder file doesn't exist), falls back to
   * speechSynthesis so the experience always has a voice.
   */
  async speak(text: string, fileSrc?: string): Promise<void> {
    if (this.muted) return;
    if (fileSrc) {
      const played = await this.tryPlayFile(fileSrc);
      if (played) return;
    }
    this.speakSynth(text);
  }

  private tryPlayFile(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const el = new Audio(src);
      let settled = false;
      el.oncanplaythrough = () => {
        if (settled) return;
        settled = true;
        el.play()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      };
      el.onerror = () => {
        if (settled) return;
        settled = true;
        resolve(false);
      };
      // Safety timeout in case neither event fires (e.g. 404 mid-fetch)
      setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, 900);
      el.load();
    });
  }

  private speakSynth(text: string) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.92;
      utter.pitch = 0.95;
      utter.volume = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => /male|david|daniel|google uk english male/i.test(v.name));
      if (preferred) utter.voice = preferred;
      window.speechSynthesis.speak(utter);
    } catch {
      /* ignore */
    }
  }
}

export const AudioManager = new AudioManagerImpl();


// export class SoundManager {
//   constructor() {
//     this._defs = new Map();
//     this._cache = new Map();
//   }

//   queue(key, src) { this._defs.set(key, src); }

//   async loadAll() {
//     // Simple: HTMLAudio (compatible, sans WebAudio API avancée)
//     for (const [key, src] of this._defs.entries()) {
//       const audio = new Audio();
//       await new Promise((res, rej) => {
//         audio.addEventListener('canplaythrough', res, { once: true });
//         audio.addEventListener('error', () => rej(new Error(`Erreur son: ${src}`)), { once: true });
//         audio.src = src;
//         audio.load();
//       });
//       this._cache.set(key, audio);
//     }
//   }

//   play(key, { volume = 1, loop = false } = {}) {
//     const src = this._defs.get(key);
//     if (!src) return;
//     const a = new Audio(src);
//     a.volume = volume;
//     a.loop = loop;
//     a.play().catch(()=>{});
//     return a; // renvoie l’instance si besoin d’arrêter ensuite
//   }
// }




// Ajout d’un placeholder sonore: beep sans asset
export class SoundManager {
  constructor() {
    this._defs = new Map();
    this._cache = new Map();
    this._ctx = null; // AudioContext (lazy)
  }

  queue(key, src) { this._defs.set(key, src); }

  async loadAll() {
    for (const [key, src] of this._defs.entries()) {
      const audio = new Audio();
      await new Promise((res, rej) => {
        audio.addEventListener('canplaythrough', res, { once: true });
        audio.addEventListener('error', () => rej(new Error(`Erreur son: ${src}`)), { once: true });
        audio.src = src;
        audio.load();
      });
      this._cache.set(key, audio);
    }
  }

  play(key, { volume = 1, loop = false } = {}) {
    const src = this._defs.get(key);
    if (!src) return;
    const a = new Audio(src);
    a.volume = volume;
    a.loop = loop;
    a.play().catch(()=>{});
    return a;
  }

  // --- Placeholder sonore: beep sans asset ---
  async beep({ frequency = 440, duration = 0.12, type = 'square', volume = 0.2 } = {}) {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this._ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    await new Promise(r => setTimeout(r, duration * 1000));
    osc.stop();
  }
}

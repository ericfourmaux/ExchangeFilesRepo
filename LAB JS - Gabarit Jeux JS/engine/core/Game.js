
export class Game {
  constructor(canvas, ctx, loader, sounds, input) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.loader = loader;
    this.sounds = sounds;
    this.input = input;

    this.scene = null;
    this.running = false;

    this._last = 0;
    this._acc = 0;
    this.fixedDt = 1 / 60; // physique fixe
    this.maxSteps = 5;
  }

  setScene(scene) {
    this.scene = scene;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now() / 1000;
    const loop = (tMs) => {
      if (!this.running) return;
      const t = tMs / 1000;
      const dt = Math.min(0.1, t - this._last); // clamp
      this._last = t;
      this._acc += dt;

      // Update fixe (physique)
      let steps = 0;
      while (this._acc >= this.fixedDt && steps++ < this.maxSteps) {
        this.scene?.update(this.fixedDt);
        this._acc -= this.fixedDt;
      }

      // Render
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.scene?.render(this.ctx);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() { this.running = false; }
}

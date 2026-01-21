
export class Animation {
  /**
   * frames: tableau d’objets { x, y, w, h } ou d’indexes interprétés par Sprite
   * fps: nombre d’images par seconde
   */
  constructor(frames = [], fps = 8, loop = true) {
    this.frames = frames;
    this.fps = fps;
    this.loop = loop;
    this.time = 0;
    this.index = 0;
    this.finished = false;
  }

  reset(){ this.time = 0; this.index = 0; this.finished = false; }

  update(dt) {
    if (this.finished) return;
    this.time += dt;
    const step = 1 / this.fps;
    while (this.time >= step) {
      this.time -= step;
      this.index++;
      if (this.index >= this.frames.length) {
        if (this.loop) this.index = 0; else { this.index = this.frames.length - 1; this.finished = true; }
      }
    }
  }

  currentFrame() { return this.frames[this.index | 0]; }
}

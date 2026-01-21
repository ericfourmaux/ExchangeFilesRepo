
// export class Camera {
//   constructor(viewW, viewH) {
//     this.pos = { x: 0, y: 0 };
//     this.viewW = viewW;
//     this.viewH = viewH;
//     this.worldBounds = { x: 0, y: 0, w: Infinity, h: Infinity }; // borne le scrolling
//     this.deadzone = { x: 0.4, y: 0.4, w: 0.2, h: 0.2 }; // en proportion de l’écran
//     this.target = null; // objet {x, y}
//     this.lerp = 0.15;   // adoucissement
//     this.axes = { x: true, y: true }; // activer horizontal/vertical
//   }

//   follow(target) { this.target = target; }

//   setBounds(x,y,w,h){ this.worldBounds = { x,y,w,h }; }

//   setAxes(horizontal=true, vertical=true){ this.axes.x = horizontal; this.axes.y = vertical; }

//   update(dt) {
//     if (!this.target) return;

//     const dx = this.viewW * this.deadzone.x;
//     const dy = this.viewH * this.deadzone.y;
//     const dzw = this.viewW * this.deadzone.w;
//     const dzh = this.viewH * this.deadzone.h;

//     // position cible à centrer si on sort de la deadzone
//     const targetScreenX = this.target.x - this.pos.x;
//     const targetScreenY = this.target.y - this.pos.y;

//     let desiredX = this.pos.x;
//     let desiredY = this.pos.y;

//     if (this.axes.x) {
//       if (targetScreenX < dx) desiredX = this.target.x - dx;
//       else if (targetScreenX > dx + dzw) desiredX = this.target.x - (dx + dzw);
//     }

//     if (this.axes.y) {
//       if (targetScreenY < dy) desiredY = this.target.y - dy;
//       else if (targetScreenY > dy + dzh) desiredY = this.target.y - (dy + dzh);
//     }

//     // lerp
//     this.pos.x += (desiredX - this.pos.x) * this.lerp;
//     this.pos.y += (desiredY - this.pos.y) * this.lerp;

//     // clamp aux bornes monde
//     this.pos.x = Math.max(this.worldBounds.x, Math.min(this.pos.x, this.worldBounds.x + this.worldBounds.w - this.viewW));
//     this.pos.y = Math.max(this.worldBounds.y, Math.min(this.pos.y, this.worldBounds.y + this.worldBounds.h - this.viewH));
//   }

//   // Conversion monde -> écran
//   worldToScreen(x, y) { return { x: x - this.pos.x, y: y - this.pos.y }; }
// }




// Ajout du mode deadzone en pixels + debug
export class Camera {
  constructor(viewW, viewH) {
    this.pos = { x: 0, y: 0 };
    this.viewW = viewW;
    this.viewH = viewH;
    this.worldBounds = { x: 0, y: 0, w: Infinity, h: Infinity };
    // Modes deadzone: 'ratio' (proportions de l'écran) ou 'px' (pixels)
    this.deadzoneMode = 'ratio';
    this.deadzone = { x: 0.4, y: 0.4, w: 0.2, h: 0.2 }; // ratio
    this.deadzonePx = { x: 200, y: 120, w: 200, h: 160 }; // pixels
    this.target = null; // {x,y}
    this.lerp = 0.15;
    this.axes = { x: true, y: true };
    this.debugShowDeadzone = false;
  }

  follow(target) { this.target = target; }
  setBounds(x,y,w,h){ this.worldBounds = { x,y,w,h }; }
  setAxes(horizontal=true, vertical=true){ this.axes.x = horizontal; this.axes.y = vertical; }

  setDeadzoneRatio(x, y, w, h) { this.deadzoneMode = 'ratio'; this.deadzone = { x, y, w, h }; }
  setDeadzonePx(x, y, w, h) { this.deadzoneMode = 'px'; this.deadzonePx = { x, y, w, h }; }

  _getDeadzoneRect() {
    if (this.deadzoneMode === 'ratio') {
      const dx = this.viewW * this.deadzone.x;
      const dy = this.viewH * this.deadzone.y;
      const dzw = this.viewW * this.deadzone.w;
      const dzh = this.viewH * this.deadzone.h;
      return { x: dx, y: dy, w: dzw, h: dzh };
    } else {
      return { ...this.deadzonePx };
    }
  }

  update(dt) {
    if (!this.target) return;
    const dz = this._getDeadzoneRect();

    const targetScreenX = this.target.x - this.pos.x;
    const targetScreenY = this.target.y - this.pos.y;
    let desiredX = this.pos.x;
    let desiredY = this.pos.y;

    if (this.axes.x) {
      if (targetScreenX < dz.x) desiredX = this.target.x - dz.x;
      else if (targetScreenX > dz.x + dz.w) desiredX = this.target.x - (dz.x + dz.w);
    }
    if (this.axes.y) {
      if (targetScreenY < dz.y) desiredY = this.target.y - dz.y;
      else if (targetScreenY > dz.y + dz.h) desiredY = this.target.y - (dz.y + dz.h);
    }

    this.pos.x += (desiredX - this.pos.x) * this.lerp;
    this.pos.y += (desiredY - this.pos.y) * this.lerp;

    // clamp monde
    this.pos.x = Math.max(this.worldBounds.x, Math.min(this.pos.x, this.worldBounds.x + this.worldBounds.w - this.viewW));
    this.pos.y = Math.max(this.worldBounds.y, Math.min(this.pos.y, this.worldBounds.y + this.worldBounds.h - this.viewH));
  }

  worldToScreen(x, y) { return { x: x - this.pos.x, y: y - this.pos.y }; }

  renderDeadzoneOverlay(ctx) {
    if (!this.debugShowDeadzone) return;
    const dz = this._getDeadzoneRect();
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,0,0.9)';
    ctx.setLineDash([6,4]);
    ctx.strokeRect(dz.x|0, dz.y|0, dz.w|0, dz.h|0);
    ctx.restore();
  }
}

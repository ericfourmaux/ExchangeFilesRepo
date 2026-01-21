
import { Rect } from '../math/Rect.js';
import { Vector2 } from '../math/Vector2.js';

export class Collider {
  constructor(type) { this.type = type; this.isTrigger = false; this.offset = new Vector2(0,0); }
  // world position of collider depends on owner position + offset
  attach(owner){ this.owner = owner; return this; }
}

export class AABBCollider extends Collider {
  constructor(width, height) {
    super('aabb');
    this.w = width; this.h = height;
  }
  rect() {
    const x = (this.owner?.pos.x || 0) + this.offset.x;
    const y = (this.owner?.pos.y || 0) + this.offset.y;
    return new Rect(x, y, this.w, this.h);
  }
}

export class CircleCollider extends Collider {
  constructor(radius) {
    super('circle');
    this.r = radius;
  }
  center() {
    const x = (this.owner?.pos.x || 0) + this.offset.x;
    const y = (this.owner?.pos.y || 0) + this.offset.y;
    return new Vector2(x + this.r, y + this.r); // si position = coin supérieur gauche
  }
}

// --- Tests de collisions basiques ---
export const Collisions = {
  aabbVsAabb(a, b) {
    const ra = a.rect(), rb = b.rect();
    if (!ra.intersects(rb)) return null;

    // MTV (Minimum Translation Vector) pour séparer
    const dx1 = rb.right - ra.left;   // pénétration si on pousse a vers la gauche
    const dx2 = ra.right - rb.left;   // vers la droite
    const dy1 = rb.bottom - ra.top;   // vers le haut
    const dy2 = ra.bottom - rb.top;   // vers le bas

    // choisir l’axe minimal
    const penX = Math.min(dx1, dx2);
    const penY = Math.min(dy1, dy2);

    if (penX < penY) {
      const nx = (dx1 < dx2) ? -1 : 1;
      return { normal: new Vector2(nx, 0), penetration: penX };
    } else {
      const ny = (dy1 < dy2) ? -1 : 1;
      return { normal: new Vector2(0, ny), penetration: penY };
    }
  },

  circleVsCircle(a, b) {
    const ca = a.center();
    const cb = b.center();
    const d = Vector2.sub(cb, ca);
    const dist = d.length();
    const pen = (a.r + b.r) - dist;
    if (pen <= 0) return null;
    const normal = dist === 0 ? new Vector2(1, 0) : d.scale(1 / dist);
    return { normal, penetration: pen };
    },

  aabbVsCircle(aabb, circ) {
    const r = aabb.rect();
    const c = circ.center();
    const nearestX = Math.max(r.left, Math.min(c.x, r.right));
    const nearestY = Math.max(r.top, Math.min(c.y, r.bottom));
    const dx = c.x - nearestX;
    const dy = c.y - nearestY;
    const dist2 = dx*dx + dy*dy;
    if (dist2 > circ.r * circ.r) return null;
    const dist = Math.sqrt(dist2);
    const normal = dist === 0 ? new Vector2(1,0) : new Vector2(dx/dist, dy/dist);
    const penetration = circ.r - dist;
    return { normal, penetration };
  }
};

// NOTE: Pour des polygones convexes, on pourrait ajouter un SAT (Separating Axis Theorem) ultérieurement.

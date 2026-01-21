
export class Vector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  copy() { return new Vector2(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  scale(s) { this.x *= s; this.y *= s; return this; }
  length() { return Math.hypot(this.x, this.y); }
  normalize() { const l = this.length() || 1; this.x /= l; this.y /= l; return this; }
  static add(a,b){ return new Vector2(a.x+b.x, a.y+b.y); }
  static sub(a,b){ return new Vector2(a.x-b.x, a.y-b.y); }
  static dot(a,b){ return a.x*b.x + a.y*b.y; }
}

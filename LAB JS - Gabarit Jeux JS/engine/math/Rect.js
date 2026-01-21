
export class Rect {
  constructor(x=0, y=0, w=0, h=0) { this.x=x; this.y=y; this.w=w; this.h=h; }
  get left(){ return this.x; }
  get right(){ return this.x + this.w; }
  get top(){ return this.y; }
  get bottom(){ return this.y + this.h; }
  intersects(other) {
    return !(this.right <= other.left || this.left >= other.right || this.bottom <= other.top || this.top >= other.bottom);
  }
}

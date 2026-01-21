
import { AABBCollider } from '../collision/Colliders.js';
let _idSeq = 1;

export class GameObject {
  constructor(x = 0, y = 0, w = 16, h = 16) {
    this._id = _idSeq++;
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.size = { w, h };
    this.z = 0;
    this.sprite = null;       // instance de Sprite
    this.animation = null;    // instance d’Animation
    this.collider = new AABBCollider(w, h).attach(this);
    this.gravity = 900;       // px/s² (ajuste selon le scale)
    this.friction = 0.85;     // simple friction horizontale au sol
    this.grounded = false;
    this.flipX = false;
    this.tag = '';            // 'player','enemy','pickup'...
    this.alive = true;
  }

  getAABB() {
    return { x: this.pos.x, y: this.pos.y, w: this.size.w, h: this.size.h };
  }

  update(dt, scene) {
    // Physique simple
    if (!this.grounded) this.vel.y += this.gravity * dt;

    // Déplacement
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Animation
    this.animation?.update(dt);
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    if (this.sprite) {
      if (this.animation) {
        const f = this.animation.currentFrame();
        // support frame rect
        if (f && f.w !== undefined) {
          this.sprite.drawFrameRect(ctx, screen.x, screen.y, f, { flipX: this.flipX });
        } else {
          this.sprite.draw(ctx, screen.x, screen.y, { frame: f ?? 0, flipX: this.flipX });
        }
      } else {
        this.sprite.draw(ctx, screen.x, screen.y, { frame: 0, flipX: this.flipX });
      }
    } else {
      // Debug: rectangle si pas de sprite
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(screen.x|0, screen.y|0, this.size.w, this.size.h);
    }
  }

  onCollision(other, info) {}
  onTrigger(other) {}
}
``

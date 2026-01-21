
// import { GameObject } from '../../engine/world/GameObject.js';
// import { AABBCollider } from '../../engine/collision/Colliders.js';

// export class Projectile extends GameObject {
//   constructor(x, y, dirX = 1, speed = 500, life = 1.2) {
//     super(x, y, 8, 4);
//     this.tag = 'projectile';
//     this.gravity = 0;
//     this.vel.x = dirX * speed;
//     this.life = life;
//     this.damage = 1;
//     this.collider = new AABBCollider(this.size.w, this.size.h).attach(this);
//     this.collider.isTrigger = true; // on ne pousse rien, on “percute”
//   }

//   update(dt, scene) {
//     super.update(dt, scene);
//     this.life -= dt;
//     if (this.life <= 0) this.alive = false;
//   }

//   onTrigger(other) {
//     if (other.tag === 'enemy') {
//       other.hurt?.(this.damage);
//       this.alive = false;
//     } else if (other.tag !== 'player') {
//       // contre toute autre chose (ex: mur/tile statique)
//       this.alive = false;
//     }
//   }

//   render(ctx, camera) {
//     const p = camera.worldToScreen(this.pos.x, this.pos.y);
//     ctx.fillStyle = '#ffcc33';
//     ctx.fillRect(p.x|0, p.y|0, this.size.w, this.size.h);
//   }
// }







// Nouvelle version avec cercle et options
import { GameObject } from '../../engine/world/GameObject.js';
import { AABBCollider } from '../../engine/collision/Colliders.js';

export class Projectile extends GameObject {
  constructor(x, y, vx = 500, vy = 0, life = 1.2, radius = 3, color = '#ffcc33') {
    super(x, y, radius*2, radius*2);
    this.tag = 'projectile';
    this.gravity = 0;
    this.vel.x = vx;
    this.vel.y = vy;
    this.life = life;
    this.damage = 1;
    this.r = radius;
    this.color = color;
    this.collider = new AABBCollider(this.size.w, this.size.h).attach(this);
    this.collider.isTrigger = true;
  }

  update(dt, scene) {
    // Pas d’animation/gravité
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  onTrigger(other) {
    if (other.tag === 'enemy') {
      other.hurt?.(this.damage);
      this.alive = false;
    } else if (other.tag !== 'player') {
      // Mur/tile/etc.
      this.alive = false;
    }
  }

  render(ctx, camera) {
    const p = camera.worldToScreen(this.pos.x, this.pos.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc((p.x + this.r)|0, (p.y + this.r)|0, this.r, 0, Math.PI*2);
    ctx.fill();
  }
}

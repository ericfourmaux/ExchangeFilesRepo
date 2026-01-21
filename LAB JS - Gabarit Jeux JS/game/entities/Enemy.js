
// import { GameObject } from '../../engine/world/GameObject.js';
// import { Sprite } from '../../engine/graphics/Sprite.js';
// import { AABBCollider } from '../../engine/collision/Colliders.js';

// export class Enemy extends GameObject {
//   constructor(x, y, spriteImage) {
//     super(x, y, 24, 24);
//     this.tag = 'enemy';
//     this.sprite = new Sprite(spriteImage, 24, 24);
//     this.collider = new AABBCollider(22, 22).attach(this);
//     this.collider.offset.set?.(1,1);
//     this.patrol = { left: x - 60, right: x + 60, speed: 80 };
//     this.vel.x = this.patrol.speed;
//   }

//   update(dt, scene) {
//     // simple patrouille horizontale
//     if (this.pos.x < this.patrol.left) this.vel.x = Math.abs(this.patrol.speed);
//     if (this.pos.x > this.patrol.right) this.vel.x = -Math.abs(this.patrol.speed);
//     this.flipX = this.vel.x < 0;
//     super.update(dt, scene);
//   }
// }




// Nouvelle version avec vie et méthode hurt()
import { GameObject } from '../../engine/world/GameObject.js';
import { Sprite } from '../../engine/graphics/Sprite.js';
import { AABBCollider } from '../../engine/collision/Colliders.js';

export class Enemy extends GameObject {
  constructor(x, y, spriteImage) {
    super(x, y, 24, 24);
    this.tag = 'enemy';
    this.sprite = new Sprite(spriteImage, 24, 24);
    this.collider = new AABBCollider(22, 22).attach(this);
    this.collider.offset.set?.(1,1);
    this.patrol = { left: x - 60, right: x + 60, speed: 80 };
    this.vel.x = this.patrol.speed;
    this.hp = 2;
  }

  hurt(dmg = 1) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  update(dt, scene) {
    if (this.pos.x < this.patrol.left) this.vel.x = Math.abs(this.patrol.speed);
    if (this.pos.x > this.patrol.right) this.vel.x = -Math.abs(this.patrol.speed);
    this.flipX = this.vel.x < 0;
    super.update(dt, scene);
  }
}

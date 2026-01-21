
// import { GameObject } from '../../engine/world/GameObject.js';
// import { Sprite } from '../../engine/graphics/Sprite.js';
// import { Animation } from '../../engine/graphics/Animation.js';
// import { AABBCollider } from '../../engine/collision/Colliders.js';

// export class Pickup extends GameObject {
//   constructor(x, y, spriteImage) {
//     super(x, y, 16, 16);
//     this.tag = 'pickup';
//     this.sprite = new Sprite(spriteImage, 16, 16);
//     this.animation = new Animation([0,1,2,3,4,5], 8, true);
//     this.collider = new AABBCollider(16, 16).attach(this);
//     this.collider.isTrigger = true; // collision en "trigger"
//     this.gravity = 0; // flottant
//     this._t = 0;
//   }

//   update(dt, scene) {
//     this._t += dt;
//     // flottement
//     this.pos.y += Math.sin(this._t * 2) * 10 * dt;
//     super.update(dt, scene);
//   }

//   onTrigger(other) {
//     if (other.tag === 'player') {
//       scene.game.sounds.play('coin', { volume: 0.7 });
//       this.alive = false;
//     }
//   }
// }






// Nouvelle version avec beep placeholder
import { GameObject } from '../../engine/world/GameObject.js';
import { Sprite } from '../../engine/graphics/Sprite.js';
import { Animation } from '../../engine/graphics/Animation.js';
import { AABBCollider } from '../../engine/collision/Colliders.js';

export class Pickup extends GameObject {
  constructor(x, y, spriteImage) {
    super(x, y, 16, 16);
    this.tag = 'pickup';
    this.sprite = new Sprite(spriteImage, 16, 16);
    this.animation = new Animation([0,1,2,3,4,5], 8, true);
    this.collider = new AABBCollider(16, 16).attach(this);
    this.collider.isTrigger = true;
    this.gravity = 0;
    this._t = 0;
  }

  update(dt, scene) {
    this._t += dt;
    this.pos.y += Math.sin(this._t * 2) * 10 * dt;
    this.animation?.update(dt);
  }

  onTrigger(other) {
    if (other.tag === 'player') {
      // Utilise un beep placeholder
      other._scene?.game?.sounds?.beep({ frequency: 880, duration: 0.08, type: 'sine', volume: 0.15 });
      this.alive = false;
    }
  }
}

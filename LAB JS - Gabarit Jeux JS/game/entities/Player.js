
// import { GameObject } from '../../engine/world/GameObject.js';
// import { Sprite } from '../../engine/graphics/Sprite.js';
// import { Animation } from '../../engine/graphics/Animation.js';
// import { AABBCollider } from '../../engine/collision/Colliders.js';

// export class Player extends GameObject {
//   constructor(x, y, spriteImage) {
//     super(x, y, 24, 24);
//     this.tag = 'player';
//     this.speed = 250;
//     this.jumpForce = -450;
//     this.sprite = new Sprite(spriteImage, 24, 24);
//     // Animation par index (suppose spritesheet 24x24)
//     this.animIdle = new Animation([0,1,2,3], 6, true);
//     this.animRun  = new Animation([4,5,6,7], 10, true);
//     this.animJump = new Animation([8], 1, false);
//     this.animation = this.animIdle;
//     this.collider = new AABBCollider(20, 22).attach(this);
//     this.collider.offset.x = 2; this.collider.offset.y = 2;
//   }

//   handleInput(input) {
//     let moving = false;
//     const left = input.isDown('ArrowLeft') || input.isDown('KeyQ');
//     const right = input.isDown('ArrowRight') || input.isDown('KeyD');
//     const up = input.isDown('ArrowUp') || input.isDown('KeyZ');
//     const down = input.isDown('ArrowDown') || input.isDown('KeyS');

//     if (left) { this.vel.x = -this.speed; this.flipX = true; moving = true; }
//     else if (right) { this.vel.x = this.speed; this.flipX = false; moving = true; }
//     else { this.vel.x *= this.friction; if (Math.abs(this.vel.x) < 5) this.vel.x = 0; }

//     // saut
//     if ((input.pressed('Space') || input.pressed('KeyW') || input.pressed('KeyZ') || input.pressed('ArrowUp')) && this.grounded) {
//       this.vel.y = this.jumpForce;
//       this.grounded = false;
//       this._wantJumpSound = true;
//     }

//     // animation
//     if (!this.grounded) this.animation = this.animJump;
//     else if (moving) this.animation = this.animRun;
//     else this.animation = this.animIdle;
//   }

//   update(dt, scene) {
//     this.handleInput(scene.game.input);

//     if (this._wantJumpSound) {
//       scene.game.sounds.play('jump', { volume: 0.6 });
//       this._wantJumpSound = false;
//     }

//     super.update(dt, scene);
//   }

//   onCollision(other, info) {
//     // détecter sol (normale vers le haut => ny = -1 du point de vue de 'other')
//     if (info.normal.y === -1) {
//       this.grounded = true;
//       this.vel.y = 0;
//     }
//     if (other.tag === 'enemy') {
//       // TODO: gérer dégâts / respawn
//       // console.log('Touché par ennemi');
//     }
//   }

//   onTrigger(other) {
//     if (other.tag === 'pickup') {
//       other.alive = false;
//     }
//   }
// }






// Nouvelle version avec tir de projectiles
// import { GameObject } from '../../engine/world/GameObject.js';
// import { Sprite } from '../../engine/graphics/Sprite.js';
// import { Animation } from '../../engine/graphics/Animation.js';
// import { AABBCollider } from '../../engine/collision/Colliders.js';
// import { Projectile } from './Projectile.js';

// export class Player extends GameObject {
//   constructor(x, y, spriteImage) {
//     super(x, y, 24, 24);
//     this.tag = 'player';
//     this.speed = 250;
//     this.jumpForce = -450;
//     this.fireCooldown = 0.18; // cadence de tir
//     this._cd = 0;
//     this.sprite = new Sprite(spriteImage, 24, 24);
//     this.animIdle = new Animation([0,1,2,3], 6, true);
//     this.animRun  = new Animation([4,5,6,7], 10, true);
//     this.animJump = new Animation([8], 1, false);
//     this.animation = this.animIdle;
//     this.collider = new AABBCollider(20, 22).attach(this);
//     this.collider.offset.x = 2; this.collider.offset.y = 2;
//     this._scene = null; // backref
//   }

//   handleInput(input, scene) {
//     let moving = false;
//     const left = input.isDown('ArrowLeft') || input.isDown('KeyQ');
//     const right = input.isDown('ArrowRight') || input.isDown('KeyD');

//     if (left) { this.vel.x = -this.speed; this.flipX = true; moving = true; }
//     else if (right) { this.vel.x = this.speed; this.flipX = false; moving = true; }
//     else { this.vel.x *= this.friction; if (Math.abs(this.vel.x) < 5) this.vel.x = 0; }

//     // saut
//     const wantJump = input.pressed('Space') || input.pressed('KeyW') || input.pressed('KeyZ') || input.pressed('ArrowUp');
//     if (wantJump && this.grounded) {
//       this.vel.y = this.jumpForce;
//       this.grounded = false;
//       scene.game.sounds.beep({ frequency: 600, duration: 0.08, type: 'square', volume: 0.1 });
//     }

//     // tir (F ou clic)
//     const wantShoot = input.pressed('KeyF') || input.mouse.pressed;
//     if (wantShoot && this._cd <= 0) {
//       this.shoot(scene);
//       this._cd = this.fireCooldown;
//     }

//     // animation
//     if (!this.grounded) this.animation = this.animJump;
//     else if (moving) this.animation = this.animRun;
//     else this.animation = this.animIdle;
//   }

//   shoot(scene) {
//     const dir = this.flipX ? -1 : 1;
//     const muzzleOffset = { x: this.flipX ? 2 : this.size.w - 10, y: 10 };
//     const px = this.pos.x + muzzleOffset.x;
//     const py = this.pos.y + muzzleOffset.y;
//     const p = new Projectile(px, py, dir, 520, 1.0);
//     scene.addObject(p);
//     scene.game.sounds.beep({ frequency: 940, duration: 0.05, type: 'triangle', volume: 0.12 });
//   }

//   update(dt, scene) {
//     this._scene = scene;
//     this._cd = Math.max(0, this._cd - dt);
//     this.handleInput(scene.game.input, scene);
//     super.update(dt, scene);
//   }

//   onCollision(other, info) {
//     // normal vers le haut => autre sous le joueur, donc sol
//     if (info.normal.y === -1) {
//       this.grounded = true;
//       this.vel.y = 0;
//     }
//     if (other.tag === 'enemy') {
//       // TODO: gérer les dégâts/respawn si besoin
//     }
//   }

//   onTrigger(other) {
//     if (other.tag === 'pickup') {
//       // traité côté Pickup
//     }
//   }
// }







// Joueur : saut variable + coyote time, arme secondaire rafales vers souris, modes de jeu
import { GameObject } from '../../engine/world/GameObject.js';
import { Sprite } from '../../engine/graphics/Sprite.js';
import { Animation } from '../../engine/graphics/Animation.js';
import { AABBCollider } from '../../engine/collision/Colliders.js';
import { Projectile } from './Projectile.js';

function norm(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

export class Player extends GameObject {
  /**
   * options:
   *  - movement: 'platformer' | 'free'
   *  - gravity: number (px/s²)
   *  - primary: 'horiz' | 'mouse' | 'up'
   */
  constructor(x, y, spriteImage, options = {}) {
    super(x, y, 24, 24);
    this.tag = 'player';

    // Config
    this.movement = options.movement || 'platformer';
    this.gravity = (options.gravity ?? this.gravity);
    this.primaryMode = options.primary || 'horiz';

    // Mouvement / saut
    this.speed = 250;
    this.speedFree = 260;        // vitesses en mode 'free'
    this.jumpForce = -450;
    this.coyoteTimeMax = 0.12;
    this.coyoteTime = 0;
    this.jumpBufferMax = 0.12;   // buffering (bonus qualité)
    this.jumpBuffer = 0;
    this.jumping = false;
    this.jumpHoldMax = 0.16;     // durée max de maintien pour saut variable
    this.jumpHoldTime = 0;
    this.jumpHoldAccel = -900;   // accélération supplémentaire pendant maintien

    // Tir
    this.fireCooldown = 0.18;
    this._cd = 0;
    this.burst = {
      count: 3,
      interval: 0.05,
      pending: 0,
      timer: 0,
      dir: { x: 1, y: 0 },
      speed: 520
    };

    // GFX
    this.sprite = new Sprite(spriteImage, 24, 24);
    this.animIdle = new Animation([0,1,2,3], 6, true);
    this.animRun  = new Animation([4,5,6,7], 10, true);
    this.animJump = new Animation([8], 1, false);
    this.animation = this.animIdle;

    // Collider
    this.collider = new AABBCollider(20, 22).attach(this);
    this.collider.offset.x = 2; this.collider.offset.y = 2;

    this._scene = null;
  }

  worldMouse(scene) {
    const mx = scene.game.input.mouse.x;
    const my = scene.game.input.mouse.y;
    return { x: scene.camera.pos.x + mx, y: scene.camera.pos.y + my };
  }

  aimDirection(scene, fallbackDir = { x: 1, y: 0 }) {
    if (this.primaryMode === 'horiz') {
      return { x: this.flipX ? -1 : 1, y: 0 };
    }
    if (this.primaryMode === 'up') {
      return { x: 0, y: -1 };
    }
    // 'mouse'
    const wm = this.worldMouse(scene);
    const cx = this.pos.x + this.size.w/2;
    const cy = this.pos.y + this.size.h/2;
    return norm(wm.x - cx, wm.y - cy);
  }

  handleInputPlatformer(input, scene, dt) {
    let moving = false;
    const left  = input.isDown('ArrowLeft') || input.isDown('KeyQ');
    const right = input.isDown('ArrowRight') || input.isDown('KeyD');

    if (left) { this.vel.x = -this.speed; this.flipX = true; moving = true; }
    else if (right) { this.vel.x = this.speed; this.flipX = false; moving = true; }
    else { this.vel.x *= this.friction; if (Math.abs(this.vel.x) < 5) this.vel.x = 0; }

    // Gestion coyote time
    if (!this.grounded) this.coyoteTime = Math.max(0, this.coyoteTime - dt);

    // Buffer saut
    const wantJumpPressed = input.pressed('Space') || input.pressed('KeyW') || input.pressed('KeyZ') || input.pressed('ArrowUp');
    if (wantJumpPressed) this.jumpBuffer = this.jumpBufferMax;

    // Déclenchement saut si conditions ok
    if (this.jumpBuffer > 0 && (this.grounded || this.coyoteTime > 0)) {
      this.vel.y = this.jumpForce;
      this.jumping = true;
      this.jumpHoldTime = 0;
      this.grounded = false;
      this.coyoteTime = 0;
      this.jumpBuffer = 0;
      scene.game.sounds.beep({ frequency: 600, duration: 0.08, type: 'square', volume: 0.1 });
    }

    // Maintien (saut variable)
    const jumpHeld = input.isDown('Space') || input.isDown('KeyW') || input.isDown('KeyZ') || input.isDown('ArrowUp');
    if (this.jumping && jumpHeld && this.jumpHoldTime < this.jumpHoldMax) {
      this.vel.y += this.jumpHoldAccel * dt; // prolonge l’ascension
      this.jumpHoldTime += dt;
    } else {
      this.jumping = false;
    }

    // Timer de buffer
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    // Tir primaire (F ou clic gauche)
    const wantShootPrimary = input.pressed('KeyF') || input.mouse.pressed;
    if (wantShootPrimary && this._cd <= 0) {
      this.shootPrimary(scene);
      this._cd = this.fireCooldown;
    }

    // Tir secondaire en rafales (R ou clic droit)
    const wantBurst = input.pressed('KeyR') || (input.mouse.pressed && input.mouse.down); // RMB non capté par défaut → on garde 'R' + clic gauche maintenu pour démo
    if (input.mouse.pressed && input.mouse.button === 2) { /* si tu gères RMB */ }
    if (wantBurst && this.burst.pending <= 0) {
      const dir = this.aimDirection(scene);
      this.startBurst(dir);
    }

    // Animation
    if (!this.grounded) this.animation = this.animJump;
    else if (moving) this.animation = this.animRun;
    else this.animation = this.animIdle;
  }

  handleInputFree(input, scene, dt) {
    // Déplacement 8 directions (aucune gravité)
    const left  = input.isDown('ArrowLeft') || input.isDown('KeyQ') || input.isDown('KeyA');
    const right = input.isDown('ArrowRight') || input.isDown('KeyD');
    const up    = input.isDown('ArrowUp') || input.isDown('KeyW') || input.isDown('KeyZ');
    const down  = input.isDown('ArrowDown') || input.isDown('KeyS');

    let dx = (right ? 1 : 0) - (left ? 1 : 0);
    let dy = (down ? 1 : 0) - (up ? 1 : 0);
    const d = norm(dx, dy);
    this.vel.x = d.x * this.speedFree;
    this.vel.y = d.y * this.speedFree;
    this.flipX = this.vel.x < 0;

    // Tir primaire
    const wantShootPrimary = input.pressed('KeyF') || input.mouse.pressed;
    if (wantShootPrimary && this._cd <= 0) {
      this.shootPrimary(scene);
      this._cd = this.fireCooldown;
    }

    // Rafales secondaires
    const wantBurst = input.pressed('KeyR');
    if (wantBurst && this.burst.pending <= 0) {
      const dir = this.aimDirection(scene);
      this.startBurst(dir);
    }

    // Anim simple
    if (Math.abs(this.vel.x) + Math.abs(this.vel.y) > 1) this.animation = this.animRun;
    else this.animation = this.animIdle;
  }

  startBurst(dir) {
    this.burst.pending = this.burst.count;
    this.burst.timer = 0;
    this.burst.dir = { x: dir.x, y: dir.y };
  }

  processBurst(dt, scene) {
    if (this.burst.pending > 0) {
      this.burst.timer -= dt;
      if (this.burst.timer <= 0) {
        // petit spread visuel
        const spread = (Math.random() - 0.5) * 0.1; // +/- ~6°
        const s = Math.hypot(this.burst.dir.x, this.burst.dir.y) || 1;
        const nx = this.burst.dir.x / s, ny = this.burst.dir.y / s;
        const rx = nx * Math.cos(spread) - ny * Math.sin(spread);
        const ry = nx * Math.sin(spread) + ny * Math.cos(spread);

        const muzzle = { x: this.pos.x + this.size.w/2, y: this.pos.y + this.size.h/2 };
        const vx = rx * this.burst.speed, vy = ry * this.burst.speed;
        const p = new Projectile(muzzle.x, muzzle.y, vx, vy, 0.9, 3, '#ffa94d');
        this._scene.addObject(p);
        this.burst.pending--;
        this.burst.timer = this.burst.interval;
        this._scene.game.sounds.beep({ frequency: 940, duration: 0.04, type: 'triangle', volume: 0.1 });
      }
    }
  }

  shootPrimary(scene) {
    let dir = this.aimDirection(scene, { x: this.flipX ? -1 : 1, y: 0 });
    // Modes prédéfinis
    if (this.primaryMode === 'up') dir = { x: 0, y: -1 };
    if (this.primaryMode === 'horiz') dir = { x: this.flipX ? -1 : 1, y: 0 };

    const muzzle = { x: this.pos.x + (this.flipX ? 4 : this.size.w - 4), y: this.pos.y + this.size.y/2 };
    const speed = 520;
    const vx = dir.x * speed, vy = dir.y * speed;
    const p = new Projectile(muzzle.x, muzzle.y, vx, vy, 1.0, 3, '#ffcc33');
    scene.addObject(p);
    scene.game.sounds.beep({ frequency: 940, duration: 0.05, type: 'triangle', volume: 0.12 });
  }

  update(dt, scene) {
    this._scene = scene;
    this._cd = Math.max(0, this._cd - dt);

    // Input selon modèle
    if (this.movement === 'platformer') this.handleInputPlatformer(scene.game.input, scene, dt);
    else this.handleInputFree(scene.game.input, scene, dt);

    // Gravité si platformer
    if (this.movement === 'platformer' && !this.grounded) this.vel.y += this.gravity * dt;

    // Avancement
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Rafales
    this.processBurst(dt, scene);

    // Anim
    this.animation?.update(dt);
  }

  onCollision(other, info) {
    // Contact sol
    if (info.normal.y === -1) {
      this.grounded = true;
      this.jumping = false;
      this.jumpHoldTime = 0;
      this.vel.y = 0;
      // Reset coyote immédiatement
      this.coyoteTime = this.coyoteTimeMax;
    }
  }

  onTrigger(other) {
    // pickups gérés de leur côté
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.pos.x, this.pos.y);
    if (this.sprite) {
      if (this.animation) {
        const f = this.animation.currentFrame();
        const frameIndex = (typeof f === 'number') ? f : 0;
        this.sprite.draw(ctx, screen.x, screen.y, { frame: frameIndex, flipX: this.flipX });
      } else {
        this.sprite.draw(ctx, screen.x, screen.y, { frame: 0, flipX: this.flipX });
      }
    } else {
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(screen.x|0, screen.y|0, this.size.w, this.size.h);
    }
  }
}

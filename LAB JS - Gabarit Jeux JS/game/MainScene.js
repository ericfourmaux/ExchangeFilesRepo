
// import { Camera } from '../engine/graphics/Camera.js';
// import { ParallaxLayer } from '../engine/graphics/ParallaxLayer.js';
// import { Sprite } from '../engine/graphics/Sprite.js';
// import { CollisionSystem } from '../engine/collision/CollisionSystem.js';
// import { TileMap } from '../engine/world/TileMap.js';
// import { Player } from './entities/Player.js';
// import { Enemy } from './entities/Enemy.js';
// import { Pickup } from './entities/Pickup.js';

// export class MainScene {
//   constructor(game) {
//     this.game = game;
//     this.objects = [];
//     this.collision = new CollisionSystem(64);

//     this.camera = new Camera(game.canvas.width, game.canvas.height);
//     this.parallax = [
//       new ParallaxLayer(this.game.loader.image('bg1'), 0.2),
//       new ParallaxLayer(this.game.loader.image('bg2'), 0.4),
//       new ParallaxLayer(this.game.loader.image('bg3'), 0.7),
//     ];

//     // --- Tilemap de test ---
//     // Crée une map 50x15 avec un sol simple
//     const W = 50, H = 15, T = 32;
//     const tiles = Array.from({ length: H }, (_, y) =>
//       Array.from({ length: W }, (_, x) => {
//         if (y === H - 1) return 1; // sol
//         if (y === H - 5 && x % 7 === 0) return 1; // quelques plateformes
//         return -1;
//       })
//     );
//     const tileset = this.game.loader.image('tiles');
//     this.tilemap = new TileMap(tiles, T, tileset, new Set([1]));

//     // --- Entités ---
//     this.player = new Player(100, 100, this.game.loader.image('player'));
//     this.objects.push(this.player);
//     this.camera.follow(this.player.pos);
//     this.camera.setBounds(0, 0, W * T, H * T);
//     this.camera.setAxes(true, true); // multidirectionnel

//     for (let i = 0; i < 5; i++) {
//       this.objects.push(new Enemy(300 + i * 120, 100, this.game.loader.image('enemy')));
//     }

//     for (let i = 0; i < 10; i++) {
//       this.objects.push(new Pickup(200 + i * 160, 140, this.game.loader.image('pickup')));
//     }

//     // Ajouter collisions statiques de la tilemap (générées à la volée par query)
//     // On injecte à chaque update des solides proches du joueur pour réduire le coût
//   }

//   update(dt) {
//     const input = this.game.input;

//     // Switch des axes de scrolling pour démonstration (optionnel)
//     if (input.pressed('Digit1')) this.camera.setAxes(true, false);   // horizontal
//     if (input.pressed('Digit2')) this.camera.setAxes(false, true);   // vertical
//     if (input.pressed('Digit3')) this.camera.setAxes(true, true);    // multi

//     // Mise à jour objets (physique simple)
//     for (const o of this.objects) {
//       if (!o.alive) continue;
//       o.grounded = false; // recalculé via collisions
//       o.update(dt, this);
//     }

//     // Collisions avec tuiles: construire une liste "statics" locale autour de chaque objet dynamique
//     this.collision.staticSolids.length = 0;
//     for (const o of this.objects) {
//       if (!o.alive || !o.collider) continue;
//       const around = this.tilemap.querySolidsAround(o.getAABB(), 1);
//       this.collision.staticSolids.push(...around);
//     }

//     // Collisions dynamiques & statiques
//     this.collision.update(this.objects.filter(o => o.alive));

//     // Nettoyage
//     this.objects = this.objects.filter(o => o.alive);

//     // Caméra
//     this.camera.update(dt);

//     // Fin input frame
//     this.game.input.postUpdate();
//   }

//   render(ctx) {
//     // Parallax
//     for (const layer of this.parallax) {
//       layer.render(ctx, this.camera, this.game.canvas.width, this.game.canvas.height);
//     }

//     // Tilemap
//     this.tilemap.render(ctx, this.camera);

//     // Objets (tri par z)
//     const visible = this.objects.slice().sort((a,b)=> a.z - b.z);
//     for (const o of visible) o.render(ctx, this.camera);

//     // HUD debug
//     ctx.fillStyle = 'rgba(0,0,0,.5)';
//     ctx.fillRect(8, 8, 240, 42);
//     ctx.fillStyle = '#fff';
//     ctx.font = '12px sans-serif';
//     ctx.fillText(`Objets: ${this.objects.length}`, 16, 24);
//     ctx.fillText(`Player: (${this.player.pos.x|0}, ${this.player.pos.y|0}) v=(${this.player.vel.x|0}, ${this.player.vel.y|0})`, 16, 40);
//   }
// }







// Intégration Tiled, projectiles, deadzone, debug
// import { Camera } from '../engine/graphics/Camera.js';
// import { ParallaxLayer } from '../engine/graphics/ParallaxLayer.js';
// import { CollisionSystem } from '../engine/collision/CollisionSystem.js';
// import { TileMap } from '../engine/world/TileMap.js';
// import { Player } from './entities/Player.js';
// import { Enemy } from './entities/Enemy.js';
// import { Pickup } from './entities/Pickup.js';
// import { TiledLoader } from '../engine/assets/TiledLoader.js';

// export class MainScene {
//   constructor(game, options = {}) {
//     this.game = game;
//     this.objects = [];
//     this.collision = new CollisionSystem(64);
//     this.camera = new Camera(game.canvas.width, game.canvas.height);
//     this.parallax = [
//       new ParallaxLayer(this.game.loader.image('bg1'), 0.2),
//       new ParallaxLayer(this.game.loader.image('bg2'), 0.4),
//       new ParallaxLayer(this.game.loader.image('bg3'), 0.7),
//     ];

//     this._useTiled = !!options.tiledJson;
//     this._tiledJson = options.tiledJson || null;

//     this.ready = false;
//     this._init();
//   }

//   async _init() {
//     if (this._useTiled) {
//       // Charger depuis un objet JSON (exemple embarqué). Peut être loadFromURL si besoin.
//       const tl = new TiledLoader(this.game.loader);
//       const { tilemap, spawns } = await tl.loadFromObject(this._tiledJson);
//       this.tilemap = tilemap;

//       // Spawns
//       const playerPos = spawns.player || { x: 100, y: 100 };
//       this.player = new Player(playerPos.x, playerPos.y, this.game.loader.image('player'));
//       this.objects.push(this.player);

//       for (const e of spawns.enemies) this.objects.push(new Enemy(e.x, e.y, this.game.loader.image('enemy')));
//       for (const p of spawns.pickups) this.objects.push(new Pickup(p.x, p.y, this.game.loader.image('pickup')));

//       // Monde
//       this.camera.follow(this.player.pos);
//       const worldW = this.tilemap.w * this.tilemap.tileSize;
//       const worldH = this.tilemap.h * this.tilemap.tileSize;
//       this.camera.setBounds(0, 0, worldW, worldH);
//       this.camera.setAxes(true, true);
//       this.ready = true;
//     } else {
//       // Fallback: petite map procédurale
//       const T = 32, W = 50, H = 15;
//       const tiles = Array.from({ length: H }, (_, y) =>
//         Array.from({ length: W }, (_, x) => (y === H - 1 || (y === H - 5 && x % 7 === 0)) ? 1 : -1)
//       );
//       this.tilemap = new TileMap(tiles, T, this.game.loader.image('tiles'), new Set([1]));
//       this.player = new Player(100, 100, this.game.loader.image('player'));
//       this.objects.push(this.player);
//       for (let i = 0; i < 5; i++) this.objects.push(new Enemy(300 + i * 120, 100, this.game.loader.image('enemy')));
//       for (let i = 0; i < 10; i++) this.objects.push(new Pickup(200 + i * 160, 140, this.game.loader.image('pickup')));
//       this.camera.follow(this.player.pos);
//       this.camera.setBounds(0, 0, W * T, H * T);
//       this.camera.setAxes(true, true);
//       this.ready = true;
//     }
//   }

//   addObject(o) {
//     this.objects.push(o);
//   }

//   update(dt) {
//     if (!this.ready) return;
//     const input = this.game.input;

//     // Démo: axes de scrolling
//     if (input.pressed('Digit1')) this.camera.setAxes(true, false);
//     if (input.pressed('Digit2')) this.camera.setAxes(false, true);
//     if (input.pressed('Digit3')) this.camera.setAxes(true, true);

//     // Deadzone controls
//     if (input.pressed('KeyC')) {
//       this.camera.deadzoneMode = this.camera.deadzoneMode === 'ratio' ? 'px' : 'ratio';
//     }
//     const kO = input.pressed('KeyO'), kP = input.pressed('KeyP'), kK = input.pressed('KeyK'), kL = input.pressed('KeyL');
//     if (this.camera.deadzoneMode === 'ratio') {
//       if (kO) this.camera.deadzone.w = Math.max(0.05, this.camera.deadzone.w - 0.05);
//       if (kP) this.camera.deadzone.w = Math.min(0.9, this.camera.deadzone.w + 0.05);
//       if (kK) this.camera.deadzone.h = Math.max(0.05, this.camera.deadzone.h - 0.05);
//       if (kL) this.camera.deadzone.h = Math.min(0.9, this.camera.deadzone.h + 0.05);
//     } else {
//       if (kO) this.camera.deadzonePx.w = Math.max(40, this.camera.deadzonePx.w - 20);
//       if (kP) this.camera.deadzonePx.w = Math.min(this.game.canvas.width, this.camera.deadzonePx.w + 20);
//       if (kK) this.camera.deadzonePx.h = Math.max(40, this.camera.deadzonePx.h - 20);
//       if (kL) this.camera.deadzonePx.h = Math.min(this.game.canvas.height, this.camera.deadzonePx.h + 20);
//     }
//     if (input.pressed('KeyG')) this.camera.debugShowDeadzone = !this.camera.debugShowDeadzone;

//     // Physique/anim
//     for (const o of this.objects) {
//       if (!o.alive) continue;
//       o.grounded = false;
//       o.update(dt, this);
//     }

//     // Collisions avec tiles (solides autour de chaque objet dynamique)
//     this.collision.staticSolids.length = 0;
//     for (const o of this.objects) {
//       if (!o.alive || !o.collider) continue;
//       const around = this.tilemap.querySolidsAround(o.getAABB(), 1);
//       // Tag utile pour callback éventuelle
//       for (const s of around) s.tag = s.tag || 'tile';
//       this.collision.staticSolids.push(...around);
//     }

//     // Collisions dynamiques
//     this.collision.update(this.objects.filter(o => o.alive));

//     // Nettoyage
//     this.objects = this.objects.filter(o => o.alive);

//     // Caméra
//     this.camera.update(dt);

//     // Fin frame input
//     this.game.input.postUpdate();
//   }

//   render(ctx) {
//     if (!this.ready) return;
//     for (const layer of this.parallax) layer.render(ctx, this.camera, this.game.canvas.width, this.game.canvas.height);
//     this.tilemap.render(ctx, this.camera);

//     const visible = this.objects.slice().sort((a,b)=> a.z - b.z);
//     for (const o of visible) o.render(ctx, this.camera);

//     // Overlay deadzone
//     this.camera.renderDeadzoneOverlay(ctx);

//     // HUD debug
//     ctx.fillStyle = 'rgba(0,0,0,.5)';
//     ctx.fillRect(8, 8, 320, 56);
//     ctx.fillStyle = '#fff';
//     ctx.font = '12px sans-serif';
//     ctx.fillText(`Objets: ${this.objects.length}`, 16, 24);
//     ctx.fillText(`Player: (${this.player.pos.x|0}, ${this.player.pos.y|0}) v=(${this.player.vel.x|0}, ${this.player.vel.y|0})`, 16, 40);
//     ctx.fillText(`Cam deadzone: ${this.camera.deadzoneMode}`, 16, 56);
//   }
// }







// Changement: Choix du mode de jeu (plateforme, shmup, top-down...) + Tiled URL
import { Camera } from '../engine/graphics/Camera.js';
import { ParallaxLayer } from '../engine/graphics/ParallaxLayer.js';
import { CollisionSystem } from '../engine/collision/CollisionSystem.js';
import { TileMap } from '../engine/world/TileMap.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Pickup } from './entities/Pickup.js';
import { TiledLoader } from '../engine/assets/TiledLoader.js';

const MODE_CONFIG = {
  platformer: { gravity: 900, movement: 'platformer', primary: 'horiz', axes: {x:true,y:true}, autoScrollY: 0 },
  runngun:    { gravity: 900, movement: 'platformer', primary: 'mouse', axes: {x:true,y:true}, autoScrollY: 0 },
  shmup:      { gravity: 0,   movement: 'free',       primary: 'up',    axes: {x:true,y:true}, autoScrollY: 0 },
  topdown:    { gravity: 0,   movement: 'free',       primary: 'mouse', axes: {x:true,y:true}, autoScrollY: 0 }
};

export class MainScene {
  constructor(game, options = {}) {
    this.game = game;
    this.objects = [];
    this.collision = new CollisionSystem(64);
    this.camera = new Camera(game.canvas.width, game.canvas.height);
    this.parallax = [
      new ParallaxLayer(this.game.loader.image('bg1'), 0.2),
      new ParallaxLayer(this.game.loader.image('bg2'), 0.4),
      new ParallaxLayer(this.game.loader.image('bg3'), 0.7),
    ];

    this.mode = (options.mode || 'platformer');
    this.cfg = MODE_CONFIG[this.mode] || MODE_CONFIG.platformer;

    this._tiledUrl = options.tiledUrl || null;
    this._tiledJson = options.tiledJson || null;

    this.ready = false;
    this._init();
  }

  async _init() {
    let tilemap, spawns;
    if (this._tiledUrl) {
      const tl = new TiledLoader(this.game.loader);
      ({ tilemap, spawns } = await tl.loadFromURL(this._tiledUrl));
    } else if (this._tiledJson) {
      const tl = new TiledLoader(this.game.loader);
      ({ tilemap, spawns } = await tl.loadFromObject(this._tiledJson));
    } else {
      // Fallback procédural
      const T = 32, W = 50, H = 15;
      const tiles = Array.from({ length: H }, (_, y) =>
        Array.from({ length: W }, (_, x) => (y === H - 1 || (y === H - 5 && x % 7 === 0)) ? 2 : -1)
      );
      tilemap = new TileMap(tiles, T, this.game.loader.image('tiles'), new Set([2]));
      spawns = { player: { x: 100, y: 100 }, enemies: [], pickups: [] };
    }

    this.tilemap = tilemap;
    const worldW = this.tilemap.w * this.tilemap.tileSize;
    const worldH = this.tilemap.h * this.tilemap.tileSize;

    const playerSpawn = spawns.player || { x: 100, y: 100 };
    this.player = new Player(playerSpawn.x, playerSpawn.y, this.game.loader.image('player'), {
      movement: this.cfg.movement,
      gravity: this.cfg.gravity,
      primary: this.cfg.primary
    });
    this.objects.push(this.player);

    for (const e of (spawns.enemies || [])) this.objects.push(new Enemy(e.x, e.y, this.game.loader.image('enemy')));
    for (const p of (spawns.pickups || [])) this.objects.push(new Pickup(p.x, p.y, this.game.loader.image('pickup')));

    this.camera.follow(this.player.pos);
    this.camera.setBounds(0, 0, worldW, worldH);
    this.camera.setAxes(this.cfg.axes.x, this.cfg.axes.y);

    this.ready = true;
  }

  addObject(o) { this.objects.push(o); }

  update(dt) {
    if (!this.ready) return;
    const input = this.game.input;

    // Deadzone debug toggles (inchangé)
    if (input.pressed('Digit1')) this.camera.setAxes(true, false);
    if (input.pressed('Digit2')) this.camera.setAxes(false, true);
    if (input.pressed('Digit3')) this.camera.setAxes(true, true);
    if (input.pressed('KeyC')) this.camera.deadzoneMode = this.camera.deadzoneMode === 'ratio' ? 'px' : 'ratio';
    if (input.pressed('KeyG')) this.camera.debugShowDeadzone = !this.camera.debugShowDeadzone;

    // Ajuster deadzone dimensions (O/P/K/L) — idem version précédente
    if (input.pressed('KeyO')) {
      if (this.camera.deadzoneMode === 'ratio') this.camera.deadzone.w = Math.max(0.05, this.camera.deadzone.w - 0.05);
      else this.camera.deadzonePx.w = Math.max(40, this.camera.deadzonePx.w - 20);
    }
    if (input.pressed('KeyP')) {
      if (this.camera.deadzoneMode === 'ratio') this.camera.deadzone.w = Math.min(0.9, this.camera.deadzone.w + 0.05);
      else this.camera.deadzonePx.w = Math.min(this.game.canvas.width, this.camera.deadzonePx.w + 20);
    }
    if (input.pressed('KeyK')) {
      if (this.camera.deadzoneMode === 'ratio') this.camera.deadzone.h = Math.max(0.05, this.camera.deadzone.h - 0.05);
      else this.camera.deadzonePx.h = Math.max(40, this.camera.deadzonePx.h - 20);
    }
    if (input.pressed('KeyL')) {
      if (this.camera.deadzoneMode === 'ratio') this.camera.deadzone.h = Math.min(0.9, this.camera.deadzone.h + 0.05);
      else this.camera.deadzonePx.h = Math.min(this.game.canvas.height, this.camera.deadzonePx.h + 20);
    }

    // Update objets
    for (const o of this.objects) {
      if (!o.alive) continue;
      o.grounded = false; // recalculé via collisions
      o.update(dt, this);
    }

    // Collisions vs tiles proches
    this.collision.staticSolids.length = 0;
    for (const o of this.objects) {
      if (!o.alive || !o.collider) continue;
      const around = this.tilemap.querySolidsAround(o.getAABB(), 1);
      for (const s of around) s.tag = s.tag || 'tile';
      this.collision.staticSolids.push(...around);
    }

    // Collisions dynamiques
    this.collision.update(this.objects.filter(o => o.alive));
    this.objects = this.objects.filter(o => o.alive);

    // Caméra
    this.camera.update(dt);

    // Fin frame input
    this.game.input.postUpdate();
  }

  render(ctx) {
    if (!this.ready) return;
    for (const layer of this.parallax) layer.render(ctx, this.camera, this.game.canvas.width, this.game.canvas.height);
    this.tilemap.render(ctx, this.camera);
    const visible = this.objects.slice().sort((a,b)=> a.z - b.z);
    for (const o of visible) o.render(ctx, this.camera);
    this.camera.renderDeadzoneOverlay(ctx);

    // HUD debug
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(8, 8, 360, 70);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Mode: ${this.mode}`, 16, 24);
    ctx.fillText(`Objets: ${this.objects.length}`, 16, 40);
    ctx.fillText(`Player: (${this.player.pos.x|0}, ${this.player.pos.y|0}) v=(${this.player.vel.x|0}, ${this.player.vel.y|0})`, 16, 56);
  }
}

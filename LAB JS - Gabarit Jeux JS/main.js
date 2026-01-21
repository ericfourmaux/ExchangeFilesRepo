
// import { Game } from './engine/core/Game.js';
// import { AssetLoader } from './engine/assets/AssetLoader.js';
// import { SoundManager } from './engine/audio/SoundManager.js';
// import { InputManager } from './engine/input/InputManager.js';
// import { MainScene } from './game/MainScene.js';

// const canvas = document.getElementById('game');
// const ctx = canvas.getContext('2d');

// const loader = new AssetLoader();
// const sounds = new SoundManager();
// const input = new InputManager(canvas);
// const game = new Game(canvas, ctx, loader, sounds, input);

// // Déclarer vos assets ici (images/sons)
// loader.queueImage('player', 'assets/player.png');     // remplace avec tes fichiers
// loader.queueImage('enemy', 'assets/enemy.png');
// loader.queueImage('pickup', 'assets/pickup.png');
// loader.queueImage('bg1', 'assets/parallax_far.png');
// loader.queueImage('bg2', 'assets/parallax_mid.png');
// loader.queueImage('bg3', 'assets/parallax_near.png');
// loader.queueImage('tiles', 'assets/tiles.png');

// sounds.queue('jump', 'assets/jump.wav');
// sounds.queue('coin', 'assets/coin.wav');

// (async function init() {
//   await loader.loadAll();
//   await sounds.loadAll();

//   const scene = new MainScene(game);
//   game.setScene(scene);
//   game.start();
// })();







// Sprites (player/enemy/pickup) : mini-spritesheets 24×24 ou 16×16
// Tiles 32×32 (2 tiles)
// Parallax (3 plans)
// Sons : beep() (WebAudio, aucune ressource nécessaire)
// import { Game } from './engine/core/Game.js';
// import { AssetLoader } from './engine/assets/AssetLoader.js';
// import { SoundManager } from './engine/audio/SoundManager.js';
// import { InputManager } from './engine/input/InputManager.js';
// import { MainScene } from './game/MainScene.js';

// const canvas = document.getElementById('game');
// const ctx = canvas.getContext('2d', { alpha: false });

// // --- Génération d’images placeholder ---
// function makeCanvas(w, h, draw) {
//   const c = document.createElement('canvas');
//   c.width = w; c.height = h;
//   const g = c.getContext('2d');
//   draw(g, w, h);
//   return c.toDataURL();
// }

// function spritePlayer() {
//   // 3x3 frames 24x24 = 72x72
//   return makeCanvas(72, 72, (g,w,h) => {
//     g.imageSmoothingEnabled = false;
//     for (let i=0;i<9;i++){
//       const x = (i%3)*24, y = Math.floor(i/3)*24;
//       g.fillStyle = '#2ecc71'; g.fillRect(x+2, y+4, 20, 18);
//       g.fillStyle = '#27ae60'; g.fillRect(x+4, y+6, 16, 10);
//       // yeux
//       g.fillStyle = '#fff'; g.fillRect(x+7, y+10, 3,3); g.fillRect(x+14, y+10, 3,3);
//       g.fillStyle = '#000'; g.fillRect(x+8, y+11, 1,1); g.fillRect(x+15, y+11, 1,1);
//       // varier une jambe pour "run"
//       if (i>=3 && i<=7) {
//         g.fillStyle = '#1e8449';
//         const t = i-3;
//         const off = (t%2===0) ? 2 : -2;
//         g.fillRect(x+6, y+18, 4,4);
//         g.fillRect(x+14, y+18+off, 4,4);
//       }
//     }
//   });
// }

// function spriteEnemy() {
//   return makeCanvas(72, 24, (g,w,h) => {
//     for (let i=0;i<3;i++){
//       const x = i*24;
//       g.fillStyle = '#e74c3c'; g.fillRect(x+2,2,20,20);
//       g.fillStyle = '#c0392b'; g.fillRect(x+4,6,16,12);
//       g.fillStyle = '#fff'; g.fillRect(x+7,10,3,3); g.fillRect(x+14,10,3,3);
//       g.fillStyle = '#000'; g.fillRect(x+8,11,1,1); g.fillRect(x+15,11,1,1);
//     }
//   });
// }

// function spritePickup() {
//   return makeCanvas(96, 16, (g,w,h) => {
//     for (let i=0;i<6;i++){
//       const x = i*16;
//       g.fillStyle = '#f1c40f'; g.fillRect(x+2,2,12,12);
//       g.fillStyle = '#f39c12'; g.fillRect(x+4,4,8,8);
//     }
//   });
// }

// function tileset() {
//   // 2 tiles (32x32) en ligne: 64x32
//   return makeCanvas(64, 32, (g,w,h) => {
//     // tile 0: herbe
//     g.fillStyle = '#2ecc71'; g.fillRect(0,0,32,8);
//     g.fillStyle = '#27ae60'; g.fillRect(0,8,32,24);
//     // tile 1: pierre solide
//     g.fillStyle = '#95a5a6'; g.fillRect(32,0,32,32);
//     g.fillStyle = '#7f8c8d';
//     for (let y=4; y<32; y+=8) for (let x=36; x<64; x+=8) g.fillRect(x,y,4,4);
//   });
// }

// function parallaxFar() {
//   return makeCanvas(256, 144, (g,w,h)=>{
//     g.fillStyle = '#0b132b'; g.fillRect(0,0,w,h);
//     g.fillStyle = '#1c2541'; g.fillRect(0, h-40, w, 40);
//     g.fillStyle = '#3a506b';
//     for (let i=0;i<20;i++) {
//       const x = Math.random()*w, y = h-40 - Math.random()*30, mw = 20+Math.random()*40, mh = 10+Math.random()*20;
//       g.fillRect(x|0, y|0, mw|0, mh|0);
//     }
//   });
// }
// function parallaxMid() {
//   return makeCanvas(256, 144, (g,w,h)=>{
//     g.fillStyle = 'rgba(255,255,255,0)';
//     g.clearRect(0,0,w,h);
//     g.fillStyle = '#5bc0be';
//     for (let i=0;i<30;i++) {
//       const x = Math.random()*w, y = h-30 - Math.random()*40, mw = 10+Math.random()*30, mh = 6+Math.random()*16;
//       g.fillRect(x|0, y|0, mw|0, mh|0);
//     }
//   });
// }
// function parallaxNear() {
//   return makeCanvas(256, 144, (g,w,h)=>{
//     g.fillStyle = 'rgba(255,255,255,0)';
//     g.clearRect(0,0,w,h);
//     g.fillStyle = '#e0fbfc';
//     for (let i=0;i<50;i++) {
//       const x = Math.random()*w, y = h-20 - Math.random()*30, mw = 4+Math.random()*12, mh = 4+Math.random()*10;
//       g.fillRect(x|0, y|0, mw|0, mh|0);
//     }
//   });
// }

// // --- Exemple de JSON Tiled minimal (orthogonal, une tilelayer, un objectlayer) ---
// const TILED_EXAMPLE = {
//   "height": 15,
//   "width": 50,
//   "tilewidth": 32,
//   "tileheight": 32,
//   "orientation": "orthogonal",
//   "tilesets": [
//     {
//       "firstgid": 1,
//       "name": "basic",
//       "tilewidth": 32,
//       "tileheight": 32,
//       "image": "", // ignoré si l’image 'tiles' est déjà chargée
//       "tiles": [
//         { "id": 1, "properties": [ { "name": "solid", "type": "bool", "value": true } ] }
//       ]
//     }
//   ],
//   "layers": [
//     {
//       "type": "tilelayer",
//       "name": "ground",
//       "width": 50,
//       "height": 15,
//       "data": (function(){
//         // sol dernière ligne = tile 2 (gid=2) = solide (id 1 + firstgid 1)
//         const W=50,H=15; const arr = [];
//         for (let y=0;y<H;y++){
//           for (let x=0;x<W;x++){
//             if (y===H-1) arr.push(2); // solide
//             else if (y===H-5 && x%7===0) arr.push(2); // plateformes
//             else arr.push(0); // vide
//           }
//         }
//         return arr;
//       })()
//     },
//     {
//       "type": "objectgroup",
//       "name": "spawns",
//       "objects": [
//         { "name": "player", "x": 100, "y": 100 },
//         { "name": "enemy", "x": 360, "y": 100 },
//         { "name": "enemy", "x": 520, "y": 100 },
//         { "name": "pickup", "x": 240, "y": 140 },
//         { "name": "pickup", "x": 400, "y": 140 }
//       ]
//     }
//   ]
// };

// // --- Boot ---
// const loader = new AssetLoader();
// const sounds = new SoundManager();
// const input = new InputManager(canvas);
// const game = new Game(canvas, ctx, loader, sounds, input);

// // Injecter assets placeholders
// loader.queueImage('player', spritePlayer());
// loader.queueImage('enemy', spriteEnemy());
// loader.queueImage('pickup', spritePickup());
// loader.queueImage('tiles', tileset());
// loader.queueImage('bg1', parallaxFar());
// loader.queueImage('bg2', parallaxMid());
// loader.queueImage('bg3', parallaxNear());

// (async function init() {
//   await loader.loadAll();
//   // Sounds: on utilise beep() → pas de loadAll obligatoire ici

//   const scene = new MainScene(game, { tiledJson: TILED_EXAMPLE });
//   game.setScene(scene);
//   game.start();
// })();







// Choix du mode de jeu via une constante
import { Game } from './engine/core/Game.js';
import { AssetLoader } from './engine/assets/AssetLoader.js';
import { SoundManager } from './engine/audio/SoundManager.js';
import { InputManager } from './engine/input/InputManager.js';
import { MainScene } from './game/MainScene.js';

function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  return c.toDataURL();
}

function spritePlayer() {
  // 3x3 frames 24x24 = 72x72
  return makeCanvas(72, 72, (g,w,h) => {
    g.imageSmoothingEnabled = false;
    for (let i=0;i<9;i++){
      const x = (i%3)*24, y = Math.floor(i/3)*24;
      g.fillStyle = '#2ecc71'; g.fillRect(x+2, y+4, 20, 18);
      g.fillStyle = '#27ae60'; g.fillRect(x+4, y+6, 16, 10);
      // yeux
      g.fillStyle = '#fff'; g.fillRect(x+7, y+10, 3,3); g.fillRect(x+14, y+10, 3,3);
      g.fillStyle = '#000'; g.fillRect(x+8, y+11, 1,1); g.fillRect(x+15, y+11, 1,1);
      // varier une jambe pour "run"
      if (i>=3 && i<=7) {
        g.fillStyle = '#1e8449';
        const t = i-3;
        const off = (t%2===0) ? 2 : -2;
        g.fillRect(x+6, y+18, 4,4);
        g.fillRect(x+14, y+18+off, 4,4);
      }
    }
  });
}

function spriteEnemy() {
  return makeCanvas(72, 24, (g,w,h) => {
    for (let i=0;i<3;i++){
      const x = i*24;
      g.fillStyle = '#e74c3c'; g.fillRect(x+2,2,20,20);
      g.fillStyle = '#c0392b'; g.fillRect(x+4,6,16,12);
      g.fillStyle = '#fff'; g.fillRect(x+7,10,3,3); g.fillRect(x+14,10,3,3);
      g.fillStyle = '#000'; g.fillRect(x+8,11,1,1); g.fillRect(x+15,11,1,1);
    }
  });
}

function spritePickup() {
  return makeCanvas(96, 16, (g,w,h) => {
    for (let i=0;i<6;i++){
      const x = i*16;
      g.fillStyle = '#f1c40f'; g.fillRect(x+2,2,12,12);
      g.fillStyle = '#f39c12'; g.fillRect(x+4,4,8,8);
    }
  });
}

function tileset() {
  // 2 tiles (32x32) en ligne: 64x32
  return makeCanvas(64, 32, (g,w,h) => {
    // tile 0: herbe
    g.fillStyle = '#2ecc71'; g.fillRect(0,0,32,8);
    g.fillStyle = '#27ae60'; g.fillRect(0,8,32,24);
    // tile 1: pierre solide
    g.fillStyle = '#95a5a6'; g.fillRect(32,0,32,32);
    g.fillStyle = '#7f8c8d';
    for (let y=4; y<32; y+=8) for (let x=36; x<64; x+=8) g.fillRect(x,y,4,4);
  });
}

function parallaxFar() {
  return makeCanvas(256, 144, (g,w,h)=>{
    g.fillStyle = '#0b132b'; g.fillRect(0,0,w,h);
    g.fillStyle = '#1c2541'; g.fillRect(0, h-40, w, 40);
    g.fillStyle = '#3a506b';
    for (let i=0;i<20;i++) {
      const x = Math.random()*w, y = h-40 - Math.random()*30, mw = 20+Math.random()*40, mh = 10+Math.random()*20;
      g.fillRect(x|0, y|0, mw|0, mh|0);
    }
  });
}
function parallaxMid() {
  return makeCanvas(256, 144, (g,w,h)=>{
    g.fillStyle = 'rgba(255,255,255,0)';
    g.clearRect(0,0,w,h);
    g.fillStyle = '#5bc0be';
    for (let i=0;i<30;i++) {
      const x = Math.random()*w, y = h-30 - Math.random()*40, mw = 10+Math.random()*30, mh = 6+Math.random()*16;
      g.fillRect(x|0, y|0, mw|0, mh|0);
    }
  });
}
function parallaxNear() {
  return makeCanvas(256, 144, (g,w,h)=>{
    g.fillStyle = 'rgba(255,255,255,0)';
    g.clearRect(0,0,w,h);
    g.fillStyle = '#e0fbfc';
    for (let i=0;i<50;i++) {
      const x = Math.random()*w, y = h-20 - Math.random()*30, mw = 4+Math.random()*12, mh = 4+Math.random()*10;
      g.fillRect(x|0, y|0, mw|0, mh|0);
    }
  });
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

const loader = new AssetLoader();
const sounds = new SoundManager();
const input = new InputManager(canvas);
const game = new Game(canvas, ctx, loader, sounds, input);

// Placeholders (peuvent être remplacés par de vrais assets)
loader.queueImage('player', spritePlayer());
loader.queueImage('enemy', spriteEnemy());
loader.queueImage('pickup', spritePickup());
loader.queueImage('tiles', tileset());
loader.queueImage('bg1', parallaxFar());
loader.queueImage('bg2', parallaxMid());
loader.queueImage('bg3', parallaxNear());

// ===== Sélecteur de mode =====
// 'platformer' | 'runngun' | 'shmup' | 'topdown'
const MODE = 'runngun'; // ← change simplement ceci

(async function init() {
  await loader.loadAll();

  // Utilise le niveau Tiled prêt à l’emploi:
  const scene = new MainScene(game, {
    mode: MODE,
    tiledUrl: 'assets/level1.json'  // ← utilise le fichier livré ci-dessus
  });

  game.setScene(scene);
  game.start();
})();
``

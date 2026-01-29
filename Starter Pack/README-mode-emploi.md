# Mode d'emploi complet – Starter Jeu 2D (Vanilla JS, ES6, POO)

Ce document décrit **comment utiliser, étendre et configurer** le starter 2D fourni (version **Parallax + Triggers**). Il couvre l’architecture, les classes, les méthodes, les formats de niveaux (Array/JSON/XML), le parallax multi‑couches, les zones de trigger, l’IA, les collisions, et la personnalisation.

> **Pré‑requis** : servir le dossier via un serveur local (obligatoire pour `fetch()` JSON/XML).
>
> ```bash
> cd vanilla-js-game-starter-v2
> python -m http.server 5173
> # ouvrir http://localhost:5173
> ```

---

## 1) Structure du projet

```
vanilla-js-game-starter-v2/
  index.html
  styles.css
  assets/
    images/  (sprites + backgrounds parallax)
    sounds/  (sons wav de test)
  levels/
    level1.json   (exemple JSON avec parallax + triggers)
    level1.xml    (exemple XML avec parallax + triggers)
    level-array.js (niveau construit par tableau)
  src/
    main.js
    engine/
      Game.js, Time.js, Input.js, Renderer.js, Camera.js,
      Collision.js, Sprite.js, assets/Assets.js, Parallax.js
    game/
      TitleScreen.js, Level.js, UI.js, Player.js,
      Enemy.js, Projectile.js, Pickup.js, TriggerZone.js
    pathfinding/
      AStar.js
```

---

## 2) Point d’entrée

**`src/main.js`**
```js
import { Game } from './engine/Game.js';
const canvas = document.getElementById('game');
const game = new Game({ canvas });
game.start();
```

- Instancie `Game` et démarre la boucle (`requestAnimationFrame`).
- L’écran Titre s’affiche après chargement des assets.

---

## 3) Boucle de jeu & états – `Game`

**Fichier** : `src/engine/Game.js`

### Constructeur
```js
new Game({ canvas: HTMLCanvasElement })
```
Propriétés importantes :
- `time: Time` (delta, fps), `input: Input`, `assets: Assets` (sprites/sons),
  `renderer: Renderer`, `camera: Camera`, `ui: UI`.
- `state: 'loading' | 'title' | 'playing' | 'gameover'`.
- `level: Level | null`, `player: Player | null`, `difficulty: 'easy'|'normal'|'hard'`.

### Méthodes clés
- `start()` : démarre la boucle.
- `newGame(difficulty)` : crée `Level`, `Player`, passe en `playing`.
- `update()`/`render()` : cycle par frame.
- `handleTrigger(trigger: TriggerZone)` : **point central d’actions** déclenchées par les triggers :
  - `message` : `ui.show(text, duration)`
  - `heal` : +HP
  - `score` : +points
  - `cameraMode` : `camera.setMode('horizontal'|'vertical'|'free')`
  - `spawn` : fait apparaître `n` ennemis

> 🔧 **Ajouter un nouveau type de trigger** : ajoutez un `case` dans `handleTrigger`.

---

## 4) Temps – `Time`
**`src/engine/Time.js`**
- `dt` (secondes), `fps` lissé.
- `update()` : calcule `dt` à partir de `performance.now()`.

---

## 5) Entrées – `Input`
**`src/engine/Input.js`**
- Mappe les actions sur clavier :
  - `LEFT` : `ArrowLeft`, `A`
  - `RIGHT` : `ArrowRight`, `D`
  - `UP` : `ArrowUp`, `W`
  - `DOWN` : `ArrowDown`, `S`
  - `JUMP` : `Space`, `Z`
  - `SHOOT` : `X`, `CtrlLeft`

### API
```js
input.isDown('LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'JUMP' | 'SHOOT')
input.justPressed(action)
input.justReleased(action)
```
> 🔧 **Personnaliser les touches** : éditez le `KEYMAP` dans `Input.js`.

---

## 6) Caméra – `Camera`
**`src/engine/Camera.js`**

### Constructeur
```js
new Camera({ viewportWidth, viewportHeight, scrollMode = 'free', lerp = 0.15 })
```
- `scrollMode` : `'horizontal' | 'vertical' | 'free'`
- `lerp` (0–1) : interpolation pour suivi fluide.

### Méthodes
```js
camera.setMode('horizontal'|'vertical'|'free')
camera.follow(target, worldBounds)
```
- `target` attendu : `{ x, y, w, h }`.
- Respecte `worldBounds` du niveau (clamp X/Y).

---

## 7) Rendu – `Renderer`
**`src/engine/Renderer.js`**
```js
renderer.drawImage(img, x, y, w, h, camera)
renderer.rect(x, y, w, h, color, camera)
```
- Applique l’offset caméra.

---

## 8) Assets – `Assets`
**`src/engine/assets/Assets.js`**

### Chargement
```js
await assets.loadBulk({ images: { key: 'path.png' }, audio: { key: 'path.wav' } })
```
### Accès
```js
assets.img('key')  // HTMLImageElement
assets.snd('key')  // HTMLAudioElement
```
> Remplacez les placeholders dans `assets/images` et `assets/sounds`.

---

## 9) Collisions – `Collision`
**`src/engine/Collision.js`**
```js
Collision.aabbIntersect(a, b)         // rectangles {x,y,w,h}
Collision.circleIntersect(a, b)       // cercles {x,y,r} (x,y = coin stocké + r)
Collision.aabbCircleIntersect(a, c)
Collision.raycast(x1,y1,x2,y2, segments) // [{x1,y1,x2,y2}] → {x,y,t} | null
```
- Les entités Joueur/Ennemi utilisent des **collisions tuiles** (AABB vs carte) sur les 2 axes avec petites corrections.

---

## 10) Sprites – `Sprite`
**`src/engine/Sprite.js`**
```js
const sp = new Sprite(image, { fw, fh, frames, fps })
sp.update(dt)
sp.draw(ctx, x, y, w, h, camera)
```
> À brancher dans `Player/Enemy` si vous avez des spritesheets.

---

## 11) Parallax multi‑couches – `Parallax`
**`src/engine/Parallax.js`**

### JSON/Code de configuration d’une couche
```json
{
  "imageKey": "bg1",
  "speedX": 0.2,
  "speedY": 0.0,
  "tileX": true,
  "tileY": false,
  "offsetX": 0,
  "offsetY": 0,
  "scale": 2,
  "color": null
}
```
- `speedX/speedY` : facteur de défilement relatif à la caméra.
- `tileX/tileY` : répéter l’image pour couvrir l’écran.
- `scale` : mise à l’échelle de la couche.
- `color` : fallback si `imageKey` introuvable.

**Utilisation** : `Level.render()` appelle `this.parallax.render(...)` **avant** les tuiles/entités.

> 🔧 Configurez `parallax` directement dans le **niveau JSON/XML** (voir §14–15), ou dans `Level` (fallback par défaut).

---

## 12) UI – `UI`
**`src/game/UI.js`**
- HUD texte simple (score, énergie, vies).
- `show(text, duration)` : affiche un message centré temporaire.

---

## 13) Joueur – `Player`
**`src/game/Player.js`**

### Constructeur
```js
new Player({ game, x, y, w = 26, h = 30 })
```
Propriétés : `x,y,w,h`, `vx,vy`, `speed`, `jumpStrength`, `gravity`, `onGround`, `facing`, `hp`, `lives`, `score`, `fireCooldown`.

### Méthodes
- `update(game)` : lecture input, saut, tir, physique, collisions tuiles, pickups, contacts ennemis, mise à jour projectiles.
- `render(renderer, camera)` : sprite/rect.
- `shoot()` : crée un `Projectile`.
- `takeDamage(dmg)` : gestion HP/vies/respawn.

> **Touches** : Flèches/WASD pour bouger, Espace pour sauter, X pour tirer.

---

## 14) Ennemi – `Enemy`
**`src/game/Enemy.js`**

### Constructeur
```js
new Enemy({ game, x, y, w = 26, h = 26, ai = 'chase' | 'path' })
```
- `ai='chase'` : poursuite horizontale du joueur.
- `ai='path'` : calcule périodiquement un **chemin A*** (grille dérivée des tuiles) vers le joueur et suit les nœuds.

### Méthodes
- `update(game)` : IA + physique + collisions tuiles + dégâts par projectiles.
- `render(renderer, camera)` : sprite/rect.

> 🔧 **Créer un nouveau comportement** : étendre `Enemy` ou ajouter un champ `ai` supplémentaire (ex. `patrol`) et coder la section correspondante.

---

## 15) Projectiles – `Projectile`
**`src/game/Projectile.js`**
- Données : `{ x, y, vx, vy, r, owner }` (cercle représenté par un petit carré pour le rendu).
- `update(game)` : mouvement, mort si touche une tuile/les limites.
- `render(renderer, camera)` : carré coloré.

---

## 16) Pickups – `Pickup`
**`src/game/Pickup.js`**
- Données : `{ x, y, w, h, kind='score'|'heal', value }`.
- `collect(player)` : applique l’effet.

---

## 17) Triggers – `TriggerZone`
**`src/game/TriggerZone.js`**

### Constructeur
```js
new TriggerZone({ x, y, w, h, type='message', data=null, once=true })
```
- Déclenche `game.handleTrigger(this)` **à l’entrée** du joueur (frontière outside→inside).
- `once` : désactivation après déclenchement si `true`.
- `renderDebug(renderer, camera)` : rectangle semi‑transparent (désactivé par défaut dans le rendu du niveau).

### Types supportés (dans `Game.handleTrigger`) :
- `message` → `data.text`, `data.duration`
- `heal` → `data.amount`
- `score` → `data.points`
- `cameraMode` → `data.mode` (`horizontal` | `vertical` | `free`)
- `spawn` → `data.count`, `data.ai` (`chase` | `path`)

> 🔧 **Nouveau type** : ajoutez un `case` dans `Game.handleTrigger` et définissez l’effet souhaité.

---

## 18) Niveau – `Level`
**`src/game/Level.js`**

Rôle :
- Charger la carte (Array/JSON/XML), construire la **grille de collision** (0/1), fixer `worldBounds`.
- Gérer entités (`enemies`, `pickups`, `projectiles`) + `triggers` + `parallax`.
- Assurer les conversions (`worldToGrid`) et tests (`solidTileAt`).

### Propriétés clés
- `tileSize`, `cols`, `rows`, `tiles[]`
- `collisionGrid[row][col]` – 0 libre / 1 solide (utilisé par A*)
- `parallax: Parallax`, `triggers: TriggerZone[]`, `playerSpawn`, `worldBounds`

### Méthodes
```js
loadAll()                // essaie JSON → XML → Array → fallback plat
applyFromArray(arr)
applyFromJSON(json)
applyFromXML(xmlText)
postLoad()               // met à jour worldBounds + collisionGrid
spawnPlayer(player)
spawnEnemy({ x, y, ai })
worldToGrid(x, y)        // { row, col }
solidTileAt(x, y)        // bool
update(game)
render(renderer, camera) // parallax → tuiles → entités (→ debug triggers optionnel)
```

---

## 19) Formats de niveau

### A) **Array** (ESM) – `levels/level-array.js`
- Export par défaut d’un **tableau de lignes**, chaque cellule = `0` (vide) ou `1` (solide).
- Chargé dynamiquement si JSON/XML absents.

### B) **JSON** – `levels/level1.json`
Clés supportées :
```json
{
  "cols": 48,
  "rows": 20,
  "tileSize": 32,
  "playerSpawn": { "x": 64, "y": 64 },
  "tiles": [0,1,0,...],
  "parallax": [ { /* voir §11 */ }, ... ],
  "triggers": [
    {"x": 400, "y": 288, "w": 64, "h": 48, "type": "message", "data": {"text": "Bienvenue"}}
  ]
}
```

### C) **XML** – `levels/level1.xml`
Structure minimale :
```xml
<level cols="40" rows="16" tileSize="32">
  <tiles>0,0,1,0,...</tiles>
  <spawn x="64" y="64" />
  <parallax>
    <layer imageKey="bg1" speedX="0.2" scale="2" />
    <!-- ... -->
  </parallax>
  <triggers>
    <trigger x="500" y="256" w="64" h="48" type="message" data='{"text":"Zone XML"}' />
  </triggers>
</level>
```
> `data` côté `<trigger>` est un **JSON** stocké en attribut (parsé dans `applyFromXML`).

---

## 20) IA – `AStar`
**`src/pathfinding/AStar.js`**
- A* 4‑directions sur `collisionGrid`.
- Usage dans `Enemy (ai='path')` : trouve une séquence de cellules à rejoindre.

---

## 21) Écran titre – `TitleScreen`
- Navigation clavier **↑/↓**, **Entrée** pour démarrer.
- Convertit `facile|normal|difficile` → `easy|normal|hard` et appelle `game.newGame(...)`.

---

## 22) Exemples d’extension

### A) Ajouter une couche parallax au vol
```js
// Dans Level.applyFromJSON (après lecture json.parallax)
this.parallax.layers.push({ imageKey: 'bgClouds', speedX: 0.1, tileX: true, scale: 2 });
```

### B) Nouveau trigger : téléportation
```js
// Game.handleTrigger
case 'teleport': {
  const { x, y } = t.data || { x: 64, y: 64 };
  if (this.player) { this.player.x = x; this.player.y = y; this.player.vx = this.player.vy = 0; }
  this.ui.show('Téléporté !', 1.2);
  break;
}
```
Puis, dans le niveau JSON :
```json
{"x": 600, "y": 256, "w": 64, "h": 48, "type": "teleport", "data": {"x": 150, "y": 120}}
```

### C) Nouvel ennemi « patrol »
```js
// Enemy.update
if (this.ai === 'patrol') {
  const left = this.patrolLeft ?? (this.patrolLeft = this.x - 120);
  const right = this.patrolRight ?? (this.patrolRight = this.x + 120);
  this.vx = (this._dir = this._dir ?? 1) * this.speed;
  if (this.x < left) this._dir = 1;
  if (this.x > right) this._dir = -1;
}
```
Puis `new Enemy({ ai: 'patrol', x: 300, y: 100 })`.

---

## 23) Performance & Debug

- **Culling tuiles** : `Level.render` ne dessine que les tuiles visibles (fenêtre caméra).
- **Parallax** : privilégier des images **tileables**; évitez les énormes bitmaps.
- **Audio** : courts `.wav` → ok; pour de la musique, préférez un **loop** compressé.
- **Debug FPS** : overlay bas‑gauche (`Game` met à jour `#debug`).
- **Triggers** : activez le debug visuel en décommentant la ligne `renderDebug` (voir fin de `Level.render`).

---

## 24) Limites & pistes

- Physique simplifiée (pas de pentes, pas de slopes/coins). Pour aller plus loin : résolution séparée + normals.
- Raycast « segments » simple (utile pour visibilité/armes). Pour collision niveau : générez des segments des bords de tuiles si besoin de précision.
- Les loads `fetch()` exigent un **serveur local** (CORS/`file://`).

---

## 25) FAQ rapide

**Q: Comment changer le mode caméra en jeu ?**  
`game.camera.setMode('horizontal')` (via un trigger `cameraMode`, ou manuellement).

**Q: Comment charger un autre niveau ?**  
Changez la cible dans `Level.loadAll()` (ou modifiez/dupliquez `level1.json/xml`).

**Q: Comment remapper les touches ?**  
Modifiez le `KEYMAP` dans `Input.js`.

**Q: Comment ajouter une barre de vie graphique ?**  
Modifiez `UI.render()` pour dessiner une jauge (rectangles remplis) à partir de `game.player.hp`.

---

Bon dev, et amusez‑vous à itérer ! 💡

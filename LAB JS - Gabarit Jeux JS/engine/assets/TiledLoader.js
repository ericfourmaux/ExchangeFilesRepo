
import { TileMap } from '../world/TileMap.js';

export class TiledLoader {
  constructor(loader) {
    this.loader = loader; // AssetLoader
  }

  async loadFromURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Tiled JSON introuvable: ${url}`);
    const json = await res.json();
    return this._buildFromJSON(json);
  }

  async loadFromObject(json) {
    return this._buildFromJSON(json);
  }

  async _buildFromJSON(json) {
    if (json.orientation !== 'orthogonal') {
      throw new Error('Seul le mode orthogonal Tiled est supporté.');
    }
    const tileW = json.tilewidth, tileH = json.tileheight;
    if (tileW !== tileH) {
      console.warn('Tiles non carrés : le moteur suppose des tuiles carrées, résultats non garantis.');
    }

    // Gérer un (seul) tileset pour le gabarit (extensible ensuite)
    const ts0 = json.tilesets[0];
    const firstGid = ts0.firstgid || 1;
    let tilesetImgKey = 'tiles';
    // Si l’image du tileset n’est pas déjà chargée, on tente de la charger
    if (!this.loader.image(tilesetImgKey)) {
      if (ts0.image) {
        await this.loader.loadImage(tilesetImgKey, ts0.image);
      } else {
        throw new Error('Tileset image introuvable et clé "tiles" absente des assets.');
      }
    }

    // Déterminer les indexes solides via propriétés de tileset
    const solidIndexes = new Set();
    if (Array.isArray(ts0.tiles)) {
      for (const t of ts0.tiles) {
        const props = (t.properties || []).reduce((acc,p)=> (acc[p.name]=p.value, acc), {});
        if (props.solid) solidIndexes.add(firstGid + t.id);
      }
    }

    // Chercher la première tilelayer pour le rendu/collision
    let tileLayer = json.layers.find(l => l.type === 'tilelayer');
    if (!tileLayer) throw new Error('Aucune tilelayer dans le JSON Tiled.');
    // data peut être 1D, on reconstruit en 2D
    const W = tileLayer.width, H = tileLayer.height;
    const data = tileLayer.data;
    const tiles2D = [];
    for (let y = 0; y < H; y++) {
      tiles2D[y] = [];
      for (let x = 0; x < W; x++) {
        const gid = data[y * W + x] || -1;
        tiles2D[y][x] = gid === 0 ? -1 : gid; // 0 => vide
      }
    }

    const tilemap = new TileMap(tiles2D, tileW, this.loader.image(tilesetImgKey), solidIndexes);

    // Spawns via object layers (nom/type: 'player','enemy','pickup')
    const spawns = { player: null, enemies: [], pickups: [] };
    for (const layer of json.layers) {
      if (layer.type === 'objectgroup') {
        for (const o of layer.objects) {
          const type = (o.type || o.name || '').toLowerCase();
          const ox = Math.round(o.x), oy = Math.round(o.y - tileH); // Tiled place y en bas de l’objet
          if (type === 'player' && !spawns.player) spawns.player = { x: ox, y: oy };
          else if (type === 'enemy') spawns.enemies.push({ x: ox, y: oy });
          else if (type === 'pickup') spawns.pickups.push({ x: ox, y: oy });
        }
      }
    }

    return { tilemap, spawns };
  }
}

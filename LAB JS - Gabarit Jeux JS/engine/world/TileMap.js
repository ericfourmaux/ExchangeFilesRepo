
// Tilemap très simple (tuiles carrées, atlas de tiles)
export class TileMap {
  /**
   * tiles: tableau 2D d’indexes (ou -1 pour vide)
   * tileSize: taille pixels
   * tileset: Image (atlas)
   * solidIndexes: Set d’indexes solides
   */
  constructor(tiles, tileSize, tileset, solidIndexes = new Set()) {
    this.tiles = tiles;
    this.w = tiles[0].length;
    this.h = tiles.length;
    this.tileSize = tileSize;
    this.tileset = tileset;
    this.solid = solidIndexes;
  }

  render(ctx, camera) {
    const ts = this.tileSize;
    const startX = Math.floor(camera.pos.x / ts);
    const startY = Math.floor(camera.pos.y / ts);
    const endX = Math.ceil((camera.pos.x + camera.viewW) / ts);
    const endY = Math.ceil((camera.pos.y + camera.viewH) / ts);

    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
        const idx = this.tiles[ty][tx];
        if (idx < 0) continue;
        const sx = (idx % Math.floor(this.tileset.width / ts)) * ts;
        const sy = Math.floor(idx / Math.floor(this.tileset.width / ts)) * ts;
        const screen = camera.worldToScreen(tx * ts, ty * ts);
        ctx.drawImage(this.tileset, sx, sy, ts, ts, screen.x|0, screen.y|0, ts, ts);
      }
    }
  }

  // Renvoie une liste d’objets solides AABB "statics" (optimisé: seulement autour de l’objet)
  querySolidsAround(aabb, marginTiles = 2) {
    const ts = this.tileSize;
    const minTX = Math.floor(aabb.x / ts) - marginTiles;
    const minTY = Math.floor(aabb.y / ts) - marginTiles;
    const maxTX = Math.floor((aabb.x + aabb.w) / ts) + marginTiles;
    const maxTY = Math.floor((aabb.y + aabb.h) / ts) + marginTiles;
    const res = [];

    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
        const idx = this.tiles[ty][tx];
        if (!this.solid.has(idx)) continue;
        const x = tx * ts, y = ty * ts;
        // Objet "statique" minimal pour collision
        res.push({
          pos: { x, y },
          vel: { x: 0, y: 0 },
          getAABB: () => ({ x, y, w: ts, h: ts }),
          collider: { type: 'aabb', isTrigger: false, rect(){ return { x, y, w: ts, h: ts, left:x, top:y, right:x+ts, bottom:y+ts }; } }
        });
      }
    }
    return res;
  }
}

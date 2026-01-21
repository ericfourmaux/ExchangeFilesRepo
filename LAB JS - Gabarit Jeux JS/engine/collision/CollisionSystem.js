
// engine/collision/CollisionSystem.js
import { Collisions } from './Colliders.js';

/**
 * Spatial hash pour broadphase :
 * - cellSize : taille des cellules (px)
 * - insert(obj) : insère un objet selon son AABB
 * - query(aabb) : renvoie l’ensemble des objets dans les cellules recoupées
 */
export class SpatialHash {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.map = new Map();
  }

  _key(cx, cy) { return `${cx},${cy}`; }

  clear() { this.map.clear(); }

  insert(obj) {
    const bounds = obj.getAABB?.();
    if (!bounds) return;
    const cs = this.cellSize;

    const minCX = Math.floor(bounds.x / cs);
    const minCY = Math.floor(bounds.y / cs);
    const maxCX = Math.floor((bounds.x + bounds.w) / cs);
    const maxCY = Math.floor((bounds.y + bounds.h) / cs);

    obj._cells = [];
    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const k = this._key(cx, cy);
        if (!this.map.has(k)) this.map.set(k, new Set());
        this.map.get(k).add(obj);
        obj._cells.push(k);
      }
    }
  }

  query(bounds) {
    const res = new Set();
    if (!bounds) return [];
    const cs = this.cellSize;

    const minCX = Math.floor(bounds.x / cs);
    const minCY = Math.floor(bounds.y / cs);
    const maxCX = Math.floor((bounds.x + bounds.w) / cs);
    const maxCY = Math.floor((bounds.y + bounds.h) / cs);

    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const k = this._key(cx, cy);
        const bucket = this.map.get(k);
        if (bucket) bucket.forEach(o => res.add(o));
      }
    }
    return Array.from(res);
  }
}

/**
 * CollisionSystem
 * - spatial : broadphase
 * - staticSolids : tableaux d’objets immobiles (ex: tuiles) avec:
 *    - getAABB(): {x,y,w,h}
 *    - collider: { type: 'aabb' | 'circle', isTrigger?: boolean, rect() | center() }
 */
export class CollisionSystem {
  constructor(cellSize = 64) {
    this.spatial = new SpatialHash(cellSize);
    this.staticSolids = [];
  }

  /**
   * Met à jour les collisions pour les objets dynamiques, puis contre les solides statiques.
   * @param {Array<GameObject>} objects - entités dynamiques avec .collider et .getAABB()
   */
  update(objects) {
    // Rebuild spatial
    this.spatial.clear();
    for (const o of objects) {
      if (o?.collider) this.spatial.insert(o);
    }

    // Dynamiques ↔ dynamiques
    for (const a of objects) {
      if (!a?.collider) continue;
      const candidates = this.spatial.query(a.getAABB());
      for (const b of candidates) {
        if (a === b || !b?.collider) continue;

        // Empêche les doublons (ordonne par _id si dispo)
        const aId = a._id ?? 0, bId = b._id ?? 0;
        if (aId && bId && aId > bId) continue;

        const res = this._testPair(a, b);
        if (res) this._resolve(a, b, res, /*bIsStatic*/ false);
      }
    }

    // Dynamiques ↔ statiques
    if (this.staticSolids.length > 0) {
      for (const o of objects) {
        if (!o?.collider) continue;
        for (const s of this.staticSolids) {
          if (!s?.collider || !s.getAABB) continue;
          const res = this._testPair(o, s);
          if (res) this._resolve(o, s, res, /*bIsStatic*/ true);
        }
      }
    }
  }

  /**
   * Retourne { normal: {x,y}, penetration } si collision, sinon null.
   */
  _testPair(a, b) {
    const ca = a.collider, cb = b.collider;
    if (!ca || !cb) return null;

    const t = `${ca.type}-${cb.type}`; // 'aabb-aabb', 'circle-circle', 'aabb-circle', 'circle-aabb'

    if (t === 'aabb-aabb') return Collisions.aabbVsAabb(ca, cb);
    if (t === 'circle-circle') return Collisions.circleVsCircle(ca, cb);

    if (t === 'aabb-circle') {
      return Collisions.aabbVsCircle(ca, cb);
    }
    if (t === 'circle-aabb') {
      // Inverser la normale (on a testé dans l’autre sens)
      const r = Collisions.aabbVsCircle(cb, ca);
      if (!r) return null;
      r.normal.x *= -1; r.normal.y *= -1;
      return r;
    }

    // Non supporté (ex: polygon) → null
    return null;
  }

  /**
   * Résolution:
   * - Triggers: appelle onTrigger(a,b) & onTrigger(b,a), pas de séparation.
   * - Solides: séparation via MTV (Minimum Translation Vector) et annulation de la composante vitesse sur la normale.
   * - Statique: on déplace seulement 'a'. Dynamique/Dynamique: on sépare 50/50.
   */
  _resolve(a, b, result, bIsStatic = false) {
    const ca = a.collider, cb = b.collider;

    // Triggers
    if (ca.isTrigger || cb.isTrigger) {
      a.onTrigger?.(b);
      b.onTrigger?.(a);
      return;
    }

    const nx = result.normal.x;
    const ny = result.normal.y;
    const pen = result.penetration;

    // Séparation
    if (bIsStatic) {
      a.pos.x -= nx * pen;
      a.pos.y -= ny * pen;
    } else {
      // Deux dynamiques → chacun la moitié
      a.pos.x -= nx * (pen * 0.5);
      a.pos.y -= ny * (pen * 0.5);
      b.pos.x += nx * (pen * 0.5);
      b.pos.y += ny * (pen * 0.5);
    }

    // Correction vitesse (annule la composante entrant sur la normale)
    const avx = a.vel?.x ?? 0, avy = a.vel?.y ?? 0;
    const bvx = (bIsStatic ? 0 : (b.vel?.x ?? 0));
    const bvy = (bIsStatic ? 0 : (b.vel?.y ?? 0));
    const relvx = avx - bvx;
    const relvy = avy - bvy;

    const vn = relvx * nx + relvy * ny; // composante le long de la normale
    if (vn < 0) { // on s'approche l'un de l'autre
      if (a.vel) {
        // Si statique, on enlève toute la composante à 'a'
        // Si dynamique/dynamique, on partage l'annulation
        const k = bIsStatic ? 1.0 : 0.5;
        a.vel.x -= vn * nx * k;
        a.vel.y -= vn * ny * k;
      }
      if (!bIsStatic && b.vel) {
        // pousse b dans l'autre sens
        b.vel.x += vn * nx * 0.5;
        b.vel.y += vn * ny * 0.5;
      }
    }

    // Callbacks collision (normales opposées)
    a.onCollision?.(b, result);
    b.onCollision?.(a, { normal: { x: -nx, y: -ny }, penetration: pen });
  }
}

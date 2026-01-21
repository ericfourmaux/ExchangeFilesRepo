
// export class AssetLoader {
//   constructor() {
//     this.images = new Map();
//     this._queue = [];
//   }

//   queueImage(key, src) { this._queue.push({ key, src }); }

//   async loadAll() {
//     await Promise.all(this._queue.map(({ key, src }) => {
//       return new Promise((resolve, reject) => {
//         const img = new Image();
//         img.onload = () => { this.images.set(key, img); resolve(); };
//         img.onerror = (e) => reject(new Error(`Erreur chargement image: ${src}`));
//         img.src = src;
//       });
//     }));
//     this._queue = [];
//   }

//   image(key) { return this.images.get(key); }
// }




// Ajout d'un chargement direct
export class AssetLoader {
  constructor() {
    this.images = new Map();
    this._queue = [];
  }

  queueImage(key, src) { this._queue.push({ key, src }); }

  async loadAll() {
    await Promise.all(this._queue.map(({ key, src }) => this.loadImage(key, src)));
    this._queue = [];
  }

  async loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this.images.set(key, img); resolve(); };
      img.onerror = () => reject(new Error(`Erreur chargement image: ${src}`));
      img.src = src;
    });
  }

  image(key) { return this.images.get(key); }
}

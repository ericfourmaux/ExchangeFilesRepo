
export class Sprite {
  /**
   * image: Image
   * frameW, frameH: dimensions d’une frame si spritesheet, sinon taille entière de l’image
   */
  constructor(image, frameW = null, frameH = null) {
    this.image = image;
    this.frameW = frameW || image.width;
    this.frameH = frameH || image.height;
  }

  // Récupère le rectangle source d’un index (row-major)
  frameRect(index = 0) {
    const cols = Math.max(1, Math.floor(this.image.width / this.frameW));
    const sx = (index % cols) * this.frameW;
    const sy = Math.floor(index / cols) * this.frameH;
    return { sx, sy, sw: this.frameW, sh: this.frameH };
  }

  draw(ctx, x, y, { frame = 0, flipX = false, scale = 1, alpha = 1 } = {}) {
    const { sx, sy, sw, sh } = this.frameRect(frame);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x | 0, y | 0);
    if (flipX) { ctx.scale(-1, 1); ctx.translate(-sw * scale, 0); }
    ctx.drawImage(this.image, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale);
    ctx.restore();
  }

  drawFrameRect(ctx, x, y, srcRect, { flipX=false, scale=1, alpha=1 } = {}) {
    const { x:sx, y:sy, w:sw, h:sh } = srcRect;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x|0, y|0);
    if (flipX) { ctx.scale(-1,1); ctx.translate(-sw*scale,0); }
    ctx.drawImage(this.image, sx, sy, sw, sh, 0, 0, sw*scale, sh*scale);
    ctx.restore();
  }
}

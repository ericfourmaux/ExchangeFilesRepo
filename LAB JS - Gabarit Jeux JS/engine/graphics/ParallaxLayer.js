
export class ParallaxLayer {
  /**
   * image: Image
   * factor: 0 (fixe au fond) -> 1 (bouge comme le monde)
   */
  constructor(image, factor = 0.5) {
    this.image = image;
    this.factor = factor;
    this.visible = true;
    this.yOffset = 0; // pour vertical parallax si besoin
  }

  render(ctx, camera, canvasW, canvasH) {
    if (!this.visible) return;
    const img = this.image;
    const parallaxX = camera.pos.x * this.factor;
    const parallaxY = camera.pos.y * this.factor;

    // Tuilage horizontal/vertical pour remplir l’écran
    const startX = - (parallaxX % img.width);
    const startY = - ((parallaxY + this.yOffset) % img.height);

    for (let y = startY - img.height; y < canvasH + img.height; y += img.height) {
      for (let x = startX - img.width; x < canvasW + img.width; x += img.width) {
        ctx.drawImage(img, x | 0, y | 0);
      }
    }
  }
}

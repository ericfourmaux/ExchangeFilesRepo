
export class InputManager {
  constructor(canvas) {
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.keysReleased = new Set();

    this.mouse = { x: 0, y: 0, down: false, pressed: false, released: false };

    window.addEventListener('keydown', (e) => {
      if (!this.keysDown.has(e.code)) this.keysPressed.add(e.code);
      this.keysDown.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysReleased.add(e.code);
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', () => {
      if (!this.mouse.down) this.mouse.pressed = true;
      this.mouse.down = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
      this.mouse.released = true;
    });
  }

  // À appeler une fois par update fixe
  postUpdate() {
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.mouse.pressed = false;
    this.mouse.released = false;
  }

  isDown(code) { return this.keysDown.has(code); }
  pressed(code) { return this.keysPressed.has(code); }
  released(code) { return this.keysReleased.has(code); }
}

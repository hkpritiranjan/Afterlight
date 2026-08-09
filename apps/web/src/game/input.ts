import type { MovementVector } from './types';

const MOVE_KEYS: Record<string, MovementVector> = {
  ArrowUp:    { dx:  0, dy: -1 },
  ArrowDown:  { dx:  0, dy:  1 },
  ArrowLeft:  { dx: -1, dy:  0 },
  ArrowRight: { dx:  1, dy:  0 },
  w:          { dx:  0, dy: -1 },
  s:          { dx:  0, dy:  1 },
  a:          { dx: -1, dy:  0 },
  d:          { dx:  1, dy:  0 },
  W:          { dx:  0, dy: -1 },
  S:          { dx:  0, dy:  1 },
  A:          { dx: -1, dy:  0 },
  D:          { dx:  1, dy:  0 },
};

export class InputHandler {
  private held = new Set<string>();
  private interactPressed = false;

  private onKeyDown = (e: KeyboardEvent): void => {
    this.held.add(e.key);
    if (e.key === 'e' || e.key === 'E') this.interactPressed = true;
    // Prevent arrow keys from scrolling the page
    if (Object.keys(MOVE_KEYS).includes(e.key)) e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.held.delete(e.key);
  };

  mount(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  unmount(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  getMovementVector(): MovementVector {
    let dx = 0;
    let dy = 0;

    for (const key of this.held) {
      const v = MOVE_KEYS[key];
      if (v) {
        dx += v.dx;
        dy += v.dy;
      }
    }

    // Normalise diagonal so speed is consistent
    if (dx !== 0 && dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      dx /= mag;
      dy /= mag;
    }

    return { dx, dy };
  }

  consumeInteract(): boolean {
    const v = this.interactPressed;
    this.interactPressed = false;
    return v;
  }
}

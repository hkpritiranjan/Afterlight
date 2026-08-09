import { MAP_WIDTH, MAP_HEIGHT, PLAYER_SPEED, PLAYER_RADIUS, MAX_DT } from './constants';

interface PlayerPos {
  x: number;
  y: number;
}

export interface PlayerSnapshot {
  playerId: string;
  x: number;
  y: number;
}

export class WorldState {
  private players = new Map<string, PlayerPos>();

  addPlayer(playerId: string): PlayerPos {
    if (!this.players.has(playerId)) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 200;
      this.players.set(playerId, {
        x: Math.round(MAP_WIDTH / 2 + Math.cos(angle) * dist),
        y: Math.round(MAP_HEIGHT / 2 + Math.sin(angle) * dist),
      });
    }
    return this.players.get(playerId)!;
  }

  removePlayer(playerId: string): boolean {
    return this.players.delete(playerId);
  }

  movePlayer(playerId: string, dx: number, dy: number, dt: number): PlayerPos | null {
    const p = this.players.get(playerId);
    if (!p) return null;
    const safeDt = Math.min(Math.max(dt, 0), MAX_DT);
    p.x = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, p.x + dx * PLAYER_SPEED * safeDt));
    p.y = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, p.y + dy * PLAYER_SPEED * safeDt));
    return { x: p.x, y: p.y };
  }

  getSnapshot(): PlayerSnapshot[] {
    return Array.from(this.players.entries()).map(([playerId, pos]) => ({
      playerId,
      x: pos.x,
      y: pos.y,
    }));
  }

  getPlayer(playerId: string): { x: number; y: number } | null {
    const p = this.players.get(playerId);
    return p ? { x: p.x, y: p.y } : null;
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  size(): number {
    return this.players.size;
  }
}

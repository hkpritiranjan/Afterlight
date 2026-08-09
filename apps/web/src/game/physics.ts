import { MAP_WIDTH, MAP_HEIGHT, PLAYER_SPEED, PLAYER_RADIUS, INTERACTION_RADIUS } from './constants';
import type { GameState, MovementVector, Camera, InteractionZone } from './types';

export function movePlayer(
  state: GameState,
  movement: MovementVector,
  dt: number,
): GameState {
  const { dx, dy } = movement;
  if (dx === 0 && dy === 0) return state;

  const newX = clamp(
    state.player.x + dx * PLAYER_SPEED * dt,
    PLAYER_RADIUS,
    MAP_WIDTH - PLAYER_RADIUS,
  );
  const newY = clamp(
    state.player.y + dy * PLAYER_SPEED * dt,
    PLAYER_RADIUS,
    MAP_HEIGHT - PLAYER_RADIUS,
  );

  return { ...state, player: { x: newX, y: newY } };
}

export function detectNearbyZone(
  state: GameState,
): GameState {
  const { player, interactionZones } = state;
  let nearest: InteractionZone | null = null;
  let nearestDist = INTERACTION_RADIUS;

  for (const zone of interactionZones) {
    const d = dist(player.x, player.y, zone.x, zone.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = zone;
    }
  }

  const id = nearest?.id ?? null;
  if (id === state.nearbyZoneId) return state;
  return { ...state, nearbyZoneId: id };
}

export function tick(state: GameState, movement: MovementVector, dt: number): GameState {
  const moved = movePlayer(state, movement, dt);
  const detected = detectNearbyZone(moved);
  return { ...detected, tick: detected.tick + 1 };
}

export function computeCamera(
  playerX: number,
  playerY: number,
  viewportW: number,
  viewportH: number,
): Camera {
  return {
    x: clamp(playerX - viewportW / 2, 0, Math.max(0, MAP_WIDTH - viewportW)),
    y: clamp(playerY - viewportH / 2, 0, Math.max(0, MAP_HEIGHT - viewportH)),
  };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

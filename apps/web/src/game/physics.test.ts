import { describe, it, expect } from 'vitest';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_SPEED, PLAYER_RADIUS } from './constants';
import type { GameState } from './types';
import { movePlayer, computeCamera, detectNearbyZone, tick } from './physics';

const BASE_STATE: GameState = {
  player: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
  interactionZones: [],
  nearbyZoneId: null,
  tick: 0,
};

// ── movePlayer ────────────────────────────────────────────────────────────────

describe('movePlayer', () => {
  it('moves right by speed * dt', () => {
    const dt = 1;
    const result = movePlayer(BASE_STATE, { dx: 1, dy: 0 }, dt);
    expect(result.player.x).toBeCloseTo(BASE_STATE.player.x + PLAYER_SPEED * dt);
    expect(result.player.y).toBe(BASE_STATE.player.y);
  });

  it('moves up (negative y) when dy = -1', () => {
    const dt = 0.5;
    const result = movePlayer(BASE_STATE, { dx: 0, dy: -1 }, dt);
    expect(result.player.y).toBeCloseTo(BASE_STATE.player.y - PLAYER_SPEED * dt);
  });

  it('does not move when vector is zero', () => {
    const result = movePlayer(BASE_STATE, { dx: 0, dy: 0 }, 1);
    expect(result).toBe(BASE_STATE); // same reference — no allocation
  });

  it('clamps player to left boundary', () => {
    const state = { ...BASE_STATE, player: { x: PLAYER_RADIUS + 1, y: MAP_HEIGHT / 2 } };
    const result = movePlayer(state, { dx: -1, dy: 0 }, 1);
    expect(result.player.x).toBeGreaterThanOrEqual(PLAYER_RADIUS);
  });

  it('clamps player to right boundary', () => {
    const state = { ...BASE_STATE, player: { x: MAP_WIDTH - PLAYER_RADIUS - 1, y: MAP_HEIGHT / 2 } };
    const result = movePlayer(state, { dx: 1, dy: 0 }, 1);
    expect(result.player.x).toBeLessThanOrEqual(MAP_WIDTH - PLAYER_RADIUS);
  });

  it('clamps player to top boundary', () => {
    const state = { ...BASE_STATE, player: { x: MAP_WIDTH / 2, y: PLAYER_RADIUS + 1 } };
    const result = movePlayer(state, { dx: 0, dy: -1 }, 1);
    expect(result.player.y).toBeGreaterThanOrEqual(PLAYER_RADIUS);
  });

  it('clamps player to bottom boundary', () => {
    const state = { ...BASE_STATE, player: { x: MAP_WIDTH / 2, y: MAP_HEIGHT - PLAYER_RADIUS - 1 } };
    const result = movePlayer(state, { dx: 0, dy: 1 }, 1);
    expect(result.player.y).toBeLessThanOrEqual(MAP_HEIGHT - PLAYER_RADIUS);
  });

  it('diagonal movement covers the same distance as cardinal at same speed', () => {
    // Input vector is already normalised (1/√2, 1/√2)
    const mag = 1 / Math.sqrt(2);
    const dt = 1;
    const result = movePlayer(BASE_STATE, { dx: mag, dy: mag }, dt);
    const actualDist = Math.sqrt(
      (result.player.x - BASE_STATE.player.x) ** 2 +
      (result.player.y - BASE_STATE.player.y) ** 2,
    );
    expect(actualDist).toBeCloseTo(PLAYER_SPEED * dt, 1);
  });
});

// ── computeCamera ─────────────────────────────────────────────────────────────

describe('computeCamera', () => {
  it('centres the camera on the player', () => {
    const vpW = 800;
    const vpH = 600;
    const px = MAP_WIDTH / 2;
    const py = MAP_HEIGHT / 2;
    const cam = computeCamera(px, py, vpW, vpH);
    expect(cam.x).toBeCloseTo(px - vpW / 2);
    expect(cam.y).toBeCloseTo(py - vpH / 2);
  });

  it('clamps camera x to 0 when player is near left edge', () => {
    const cam = computeCamera(10, MAP_HEIGHT / 2, 800, 600);
    expect(cam.x).toBe(0);
  });

  it('clamps camera y to 0 when player is near top edge', () => {
    const cam = computeCamera(MAP_WIDTH / 2, 10, 800, 600);
    expect(cam.y).toBe(0);
  });

  it('clamps camera to right edge', () => {
    const vpW = 800;
    const cam = computeCamera(MAP_WIDTH - 10, MAP_HEIGHT / 2, vpW, 600);
    expect(cam.x).toBeLessThanOrEqual(MAP_WIDTH - vpW);
  });

  it('clamps camera to bottom edge', () => {
    const vpH = 600;
    const cam = computeCamera(MAP_WIDTH / 2, MAP_HEIGHT - 10, 800, vpH);
    expect(cam.y).toBeLessThanOrEqual(MAP_HEIGHT - vpH);
  });
});

// ── detectNearbyZone ──────────────────────────────────────────────────────────

describe('detectNearbyZone', () => {
  const zone = { id: 'z1', x: 500, y: 500, label: 'test' };

  it('detects a zone when player is within interaction radius', () => {
    const state: GameState = {
      ...BASE_STATE,
      player: { x: 510, y: 500 },
      interactionZones: [zone],
    };
    const result = detectNearbyZone(state);
    expect(result.nearbyZoneId).toBe('z1');
  });

  it('returns null when player is outside interaction radius', () => {
    const state: GameState = {
      ...BASE_STATE,
      player: { x: 1000, y: 1000 },
      interactionZones: [zone],
    };
    const result = detectNearbyZone(state);
    expect(result.nearbyZoneId).toBeNull();
  });

  it('picks the closest zone when multiple are in range', () => {
    const zoneA = { id: 'a', x: 505, y: 500, label: 'a' };
    const zoneB = { id: 'b', x: 520, y: 500, label: 'b' };
    const state: GameState = {
      ...BASE_STATE,
      player: { x: 500, y: 500 },
      interactionZones: [zoneA, zoneB],
    };
    const result = detectNearbyZone(state);
    expect(result.nearbyZoneId).toBe('a');
  });

  it('returns same reference when nearbyZoneId has not changed', () => {
    const state: GameState = {
      ...BASE_STATE,
      player: { x: 1000, y: 1000 },
      interactionZones: [zone],
      nearbyZoneId: null,
    };
    const result = detectNearbyZone(state);
    expect(result).toBe(state);
  });
});

// ── tick ─────────────────────────────────────────────────────────────────────

describe('tick', () => {
  it('increments tick counter each call', () => {
    const s1 = tick(BASE_STATE, { dx: 0, dy: 0 }, 0.016);
    const s2 = tick(s1, { dx: 0, dy: 0 }, 0.016);
    expect(s1.tick).toBe(1);
    expect(s2.tick).toBe(2);
  });

  it('does not mutate original state', () => {
    const original = { ...BASE_STATE };
    tick(BASE_STATE, { dx: 1, dy: 0 }, 1);
    expect(BASE_STATE.player.x).toBe(original.player.x);
  });
});

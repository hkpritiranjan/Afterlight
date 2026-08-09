import { describe, it, expect, beforeEach } from 'vitest';
import { WorldState } from '../src/game/worldState';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS } from '../src/game/constants';

describe('WorldState', () => {
  let world: WorldState;

  beforeEach(() => {
    world = new WorldState();
  });

  describe('addPlayer', () => {
    it('adds a new player and returns a position within world bounds', () => {
      const pos = world.addPlayer('p1');
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(MAP_WIDTH);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(MAP_HEIGHT);
      expect(world.size()).toBe(1);
    });

    it('is idempotent — calling twice with the same id returns the same position', () => {
      const pos1 = world.addPlayer('p1');
      const pos2 = world.addPlayer('p1');
      expect(pos2.x).toBe(pos1.x);
      expect(pos2.y).toBe(pos1.y);
      expect(world.size()).toBe(1);
    });

    it('adds multiple distinct players', () => {
      world.addPlayer('p1');
      world.addPlayer('p2');
      world.addPlayer('p3');
      expect(world.size()).toBe(3);
    });
  });

  describe('removePlayer', () => {
    it('removes an existing player and returns true', () => {
      world.addPlayer('p1');
      expect(world.removePlayer('p1')).toBe(true);
      expect(world.size()).toBe(0);
    });

    it('returns false for an unknown player', () => {
      expect(world.removePlayer('ghost')).toBe(false);
    });
  });

  describe('movePlayer', () => {
    it('moves the player right by speed × dt', () => {
      world.addPlayer('p1');
      const before = world.getSnapshot().find((p) => p.playerId === 'p1')!;
      const pos = world.movePlayer('p1', 1, 0, 0.1);
      expect(pos).not.toBeNull();
      expect(pos!.x).toBeGreaterThan(before.x);
      expect(pos!.y).toBe(before.y);
    });

    it('moves the player left', () => {
      world.addPlayer('p1');
      const before = world.getSnapshot().find((p) => p.playerId === 'p1')!;
      const pos = world.movePlayer('p1', -1, 0, 0.1);
      expect(pos!.x).toBeLessThan(before.x);
    });

    it('clamps dt to MAX_DT (0.05)', () => {
      world.addPlayer('p1');
      const posNormal = world.movePlayer('p1', 1, 0, 0.05);
      const xNormal = posNormal!.x;

      world.removePlayer('p1');
      world.addPlayer('p1');
      const posCapped = world.movePlayer('p1', 1, 0, 99);
      // Both should have advanced by the same capped amount from similar start positions
      // We can't assert exact equality because start positions differ (random), but
      // we can confirm the large dt didn't teleport the player to MAP_WIDTH.
      expect(posCapped!.x).toBeLessThan(MAP_WIDTH - PLAYER_RADIUS);
    });

    it('clamps to left world border', () => {
      world.addPlayer('p1');
      // MAX_DT=0.05, speed=180 → 9 px/call. Player starts within 200 px of center (max 2120 px from left).
      // 300 calls × 9 px = 2700 px — enough to reach the left edge from anywhere.
      let pos = world.movePlayer('p1', -1, 0, 100);
      for (let i = 0; i < 299; i++) pos = world.movePlayer('p1', -1, 0, 100);
      expect(pos!.x).toBe(PLAYER_RADIUS);
    });

    it('clamps to right world border', () => {
      world.addPlayer('p1');
      let pos = world.movePlayer('p1', 1, 0, 100);
      for (let i = 0; i < 299; i++) pos = world.movePlayer('p1', 1, 0, 100);
      expect(pos!.x).toBe(MAP_WIDTH - PLAYER_RADIUS);
    });

    it('clamps to top world border', () => {
      world.addPlayer('p1');
      let pos = world.movePlayer('p1', 0, -1, 100);
      for (let i = 0; i < 299; i++) pos = world.movePlayer('p1', 0, -1, 100);
      expect(pos!.y).toBe(PLAYER_RADIUS);
    });

    it('clamps to bottom world border', () => {
      world.addPlayer('p1');
      let pos = world.movePlayer('p1', 0, 1, 100);
      for (let i = 0; i < 299; i++) pos = world.movePlayer('p1', 0, 1, 100);
      expect(pos!.y).toBe(MAP_HEIGHT - PLAYER_RADIUS);
    });

    it('returns null for unknown player', () => {
      expect(world.movePlayer('ghost', 1, 0, 0.016)).toBeNull();
    });
  });

  describe('getSnapshot', () => {
    it('returns empty array when no players', () => {
      expect(world.getSnapshot()).toEqual([]);
    });

    it('returns all active players with their positions', () => {
      world.addPlayer('p1');
      world.addPlayer('p2');
      const snap = world.getSnapshot();
      expect(snap).toHaveLength(2);
      const ids = snap.map((p) => p.playerId).sort();
      expect(ids).toEqual(['p1', 'p2']);
    });

    it('does not include removed players', () => {
      world.addPlayer('p1');
      world.addPlayer('p2');
      world.removePlayer('p1');
      const snap = world.getSnapshot();
      expect(snap).toHaveLength(1);
      expect(snap[0].playerId).toBe('p2');
    });
  });

  describe('hasPlayer', () => {
    it('returns true for an active player', () => {
      world.addPlayer('p1');
      expect(world.hasPlayer('p1')).toBe(true);
    });

    it('returns false for an unknown player', () => {
      expect(world.hasPlayer('ghost')).toBe(false);
    });
  });
});

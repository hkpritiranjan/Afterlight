import type { GameState, InteractionZone, RemotePlayer } from './types';
import { MAP_WIDTH, MAP_HEIGHT } from './constants';
import { InputHandler } from './input';
import { tick, computeCamera } from './physics';
import { Renderer } from './renderer';
import { NetworkClient } from './network';

const MAX_DT = 0.05;
const LERP_SPEED = 12; // remote player reaches target in ~1/12 s ≈ 80 ms

const INITIAL_ZONES: InteractionZone[] = [
  { id: 'zone-a', x: MAP_WIDTH * 0.25, y: MAP_HEIGHT * 0.30, label: 'A quiet hollow' },
  { id: 'zone-b', x: MAP_WIDTH * 0.65, y: MAP_HEIGHT * 0.25, label: 'The pale arch' },
  { id: 'zone-c', x: MAP_WIDTH * 0.80, y: MAP_HEIGHT * 0.60, label: 'Open ground' },
  { id: 'zone-d', x: MAP_WIDTH * 0.40, y: MAP_HEIGHT * 0.75, label: 'The far field' },
  { id: 'zone-e', x: MAP_WIDTH * 0.15, y: MAP_HEIGHT * 0.70, label: 'Edge of sight' },
];

function createInitialState(): GameState {
  return {
    player: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
    interactionZones: INITIAL_ZONES,
    nearbyZoneId: null,
    tick: 0,
  };
}

export class GameEngine {
  private state: GameState;
  private input: InputHandler;
  private renderer: Renderer;
  private network: NetworkClient;
  private remotePlayers = new Map<string, RemotePlayer>();
  private ownPlayerId: string | null = null;
  private rafId: number | null = null;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.state = createInitialState();
    this.input = new InputHandler();
    this.renderer = new Renderer(canvas);
    this.input.mount();

    const serverUrl =
      process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? 'http://localhost:3001';

    this.network = new NetworkClient(serverUrl, {
      onSnapshot: (yourPlayerId, players) => {
        this.ownPlayerId = yourPlayerId;
        this.remotePlayers.clear();
        for (const p of players) {
          if (p.playerId === yourPlayerId) continue;
          this.remotePlayers.set(p.playerId, {
            playerId: p.playerId,
            x: p.x,
            y: p.y,
            targetX: p.x,
            targetY: p.y,
          });
        }
      },
      onPlayerJoined: (playerId, x, y) => {
        if (playerId === this.ownPlayerId) return;
        this.remotePlayers.set(playerId, { playerId, x, y, targetX: x, targetY: y });
      },
      onPlayerLeft: (playerId) => {
        this.remotePlayers.delete(playerId);
      },
      onPlayerMoved: (playerId, x, y) => {
        if (playerId === this.ownPlayerId) return;
        const rp = this.remotePlayers.get(playerId);
        if (rp) {
          rp.targetX = x;
          rp.targetY = y;
        } else {
          this.remotePlayers.set(playerId, { playerId, x, y, targetX: x, targetY: y });
        }
      },
    });
  }

  resize(logicalW: number, logicalH: number): void {
    this.renderer.resize(logicalW, logicalH);
  }

  start(): void {
    this.rafId = requestAnimationFrame((now) => {
      this.lastTime = now;
      this.rafId = requestAnimationFrame(this.loop);
    });
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.input.unmount();
    this.network.disconnect();
  }

  private loop = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, MAX_DT);
    this.lastTime = now;

    const movement = this.input.getMovementVector();
    this.state = tick(this.state, movement, dt);

    if (movement.dx !== 0 || movement.dy !== 0) {
      this.network.sendMove(movement.dx, movement.dy, dt);
    }

    this.interpolateRemotePlayers(dt);

    // Stage 3: handle this.input.consumeInteract() here

    const camera = computeCamera(
      this.state.player.x,
      this.state.player.y,
      this.renderer.viewportW,
      this.renderer.viewportH,
    );
    this.renderer.render(this.state, camera, this.remotePlayers);

    this.rafId = requestAnimationFrame(this.loop);
  };

  private interpolateRemotePlayers(dt: number): void {
    const t = Math.min(1, dt * LERP_SPEED);
    for (const rp of this.remotePlayers.values()) {
      rp.x += (rp.targetX - rp.x) * t;
      rp.y += (rp.targetY - rp.y) * t;
    }
  }
}

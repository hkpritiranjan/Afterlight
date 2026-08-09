import type {
  GameState,
  InteractionZone,
  RemotePlayer,
  MeteorEntity,
  StarEntity,
  FormState,
  GameCallbacks,
  MeteorCategory,
  ResonanceResponseType,
} from './types';
import { MAP_WIDTH, MAP_HEIGHT } from './constants';
import { InputHandler } from './input';
import { tick, computeCamera, detectNearbyMeteor } from './physics';
import { Renderer } from './renderer';
import { NetworkClient } from './network';

const MAX_DT = 0.05;
const LERP_SPEED = 12;

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
  private meteors = new Map<string, MeteorEntity>();
  private stars = new Map<string, StarEntity>();
  private ownPlayerId: string | null = null;
  private nearbyMeteorId: string | null = null;
  private rafId: number | null = null;
  private lastTime = 0;
  private callbacks: GameCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.state = createInitialState();
    this.input = new InputHandler();
    this.renderer = new Renderer(canvas);
    this.input.mount();

    const serverUrl =
      process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? 'http://localhost:3001';

    this.network = new NetworkClient(serverUrl, {
      onSnapshot: (yourPlayerId, players, meteors, stars) => {
        this.ownPlayerId = yourPlayerId;
        this.remotePlayers.clear();
        for (const p of players) {
          if (p.playerId === yourPlayerId) continue;
          this.remotePlayers.set(p.playerId, {
            playerId: p.playerId, x: p.x, y: p.y, targetX: p.x, targetY: p.y,
          });
        }
        this.meteors.clear();
        for (const m of meteors) this.meteors.set(m.meteorId, m);
        this.stars.clear();
        for (const s of stars) this.stars.set(s.starId, s);
      },
      onPlayerJoined: (playerId, x, y) => {
        if (playerId === this.ownPlayerId) return;
        this.remotePlayers.set(playerId, { playerId, x, y, targetX: x, targetY: y });
      },
      onPlayerLeft: (playerId) => { this.remotePlayers.delete(playerId); },
      onPlayerMoved: (playerId, x, y) => {
        if (playerId === this.ownPlayerId) return;
        const rp = this.remotePlayers.get(playerId);
        if (rp) { rp.targetX = x; rp.targetY = y; }
        else this.remotePlayers.set(playerId, { playerId, x, y, targetX: x, targetY: y });
      },
      onMeteorCreated: (meteor) => { this.meteors.set(meteor.meteorId, meteor); },
      onStarCreated: (star, meteorId) => {
        this.meteors.delete(meteorId);
        this.stars.set(star.starId, star);
        if (this.nearbyMeteorId === meteorId) this.nearbyMeteorId = null;
      },
      onLightEarned: (amount) => { this.callbacks.onLightUpdate(amount); },
      onNotificationHeard: (message) => { this.callbacks.onNotification(message); },
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

  submitMeteor(category: MeteorCategory, content: string): void {
    this.network.sendMeteorCreate(category, content);
    this.callbacks.onFormChange({ type: 'none' });
  }

  acknowledgeMeteor(meteorId: string, responseType: ResonanceResponseType): void {
    this.network.sendMeteorAcknowledge(meteorId, responseType);
    this.callbacks.onFormChange({ type: 'none' });
  }

  dismissForm(): void {
    this.callbacks.onFormChange({ type: 'none' });
  }

  private loop = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, MAX_DT);
    this.lastTime = now;

    const movement = this.input.getMovementVector();
    this.state = tick(this.state, movement, dt);

    if (movement.dx !== 0 || movement.dy !== 0) {
      this.network.sendMove(movement.dx, movement.dy, dt);
    }

    this.nearbyMeteorId = detectNearbyMeteor(
      this.state.player.x, this.state.player.y, this.meteors,
    );

    if (this.input.consumeInteract()) {
      if (this.nearbyMeteorId) {
        const meteor = this.meteors.get(this.nearbyMeteorId);
        if (meteor) this.callbacks.onFormChange({ type: 'read', meteor });
      } else if (this.state.nearbyZoneId) {
        this.callbacks.onFormChange({ type: 'create' });
      }
    }

    this.interpolateRemotePlayers(dt);

    const camera = computeCamera(
      this.state.player.x,
      this.state.player.y,
      this.renderer.viewportW,
      this.renderer.viewportH,
    );

    this.renderer.render(
      this.state,
      camera,
      this.remotePlayers,
      this.meteors,
      this.stars,
      this.nearbyMeteorId,
      now,
    );

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

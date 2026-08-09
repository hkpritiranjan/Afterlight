import { io, type Socket } from 'socket.io-client';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import type { ClientToServerEvents, ServerToClientEvents } from '@afterlight/protocol';
import type { MeteorCategory, MeteorEntity, StarEntity, ResonanceResponseType, CatalogItem, OwnedItem, GardenObject } from './types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface NetworkCallbacks {
  onSnapshot: (
    yourPlayerId: string,
    players: Array<{ playerId: string; x: number; y: number }>,
    meteors: MeteorEntity[],
    stars: StarEntity[],
    lightBalance: number,
    catalog: CatalogItem[],
    ownedItems: OwnedItem[],
    gardenObjects: GardenObject[],
  ) => void;
  onPlayerJoined: (playerId: string, x: number, y: number) => void;
  onPlayerLeft: (playerId: string) => void;
  onPlayerMoved: (playerId: string, x: number, y: number) => void;
  onMeteorCreated: (meteor: MeteorEntity) => void;
  onStarCreated: (star: StarEntity, meteorId: string) => void;
  onLightEarned: (amount: number) => void;
  onNotificationHeard: (message: string) => void;
  onShopBought: (item: CatalogItem, lightBalance: number) => void;
  onGardenPlaced: (obj: GardenObject) => void;
  onGardenRemoved: (objectId: string) => void;
}

export class NetworkClient {
  private socket: GameSocket;
  private sessionToken: string;
  private seq = 0;
  connected = false;

  constructor(serverUrl: string, callbacks: NetworkCallbacks) {
    this.sessionToken = this.getOrCreateToken();

    this.socket = io(serverUrl, { autoConnect: false }) as GameSocket;

    this.socket.on('connect', () => {
      this.connected = true;
      this.socket.emit('player:join', {
        sessionToken: this.sessionToken,
        protocolVersion: PROTOCOL_VERSION,
      });
    });

    this.socket.on('disconnect', () => { this.connected = false; });

    this.socket.on('world:snapshot', (payload) => {
      callbacks.onSnapshot(
        payload.yourPlayerId,
        payload.players.map((p) => ({ playerId: p.playerId, x: p.position.x, y: p.position.y })),
        payload.meteors.map((m) => ({
          meteorId: m.meteorId,
          category: m.category as MeteorCategory,
          content: m.content,
          x: m.position.x,
          y: m.position.y,
        })),
        payload.stars.map((s) => ({
          starId: s.starId,
          meteorId: s.meteorId,
          x: s.position.x,
          y: s.position.y,
        })),
        payload.lightBalance ?? 0,
        payload.catalog ?? [],
        payload.ownedItems ?? [],
        payload.gardenObjects ?? [],
      );
    });

    this.socket.on('shop:bought', (p) => callbacks.onShopBought(p.item, p.lightBalance));
    this.socket.on('garden:placed', (p) => callbacks.onGardenPlaced(p.object));
    this.socket.on('garden:removed', (p) => callbacks.onGardenRemoved(p.objectId));

    this.socket.on('player:joined', (p) => callbacks.onPlayerJoined(p.playerId, p.position.x, p.position.y));
    this.socket.on('player:left', (p) => callbacks.onPlayerLeft(p.playerId));
    this.socket.on('player:moved', (p) => callbacks.onPlayerMoved(p.playerId, p.position.x, p.position.y));

    this.socket.on('meteor:created', (m) => {
      callbacks.onMeteorCreated({
        meteorId: m.meteorId,
        category: m.category as MeteorCategory,
        content: m.content,
        x: m.position.x,
        y: m.position.y,
      });
    });

    this.socket.on('star:created', (s) => {
      callbacks.onStarCreated(
        { starId: s.starId, meteorId: s.meteorId, x: s.position.x, y: s.position.y },
        s.meteorId,
      );
    });

    this.socket.on('light:earned', (p) => callbacks.onLightEarned(p.amount));
    this.socket.on('notification:heard', (p) => callbacks.onNotificationHeard(p.message));

    this.socket.on('error', (p) => {
      console.error('[network] server error:', p.code, p.message);
    });

    this.socket.connect();
  }

  sendMove(dx: number, dy: number, dt: number): void {
    if (!this.connected) return;
    this.socket.emit('player:move', { dx, dy, dt, sequence: ++this.seq });
  }

  sendMeteorCreate(category: MeteorCategory, content: string): void {
    if (!this.connected) return;
    this.socket.emit('meteor:create', { category, content });
  }

  sendMeteorAcknowledge(meteorId: string, responseType: ResonanceResponseType): void {
    if (!this.connected) return;
    this.socket.emit('meteor:acknowledge', { meteorId, responseType });
  }

  sendShopBuy(itemId: string): void {
    if (!this.connected) return;
    this.socket.emit('shop:buy', { itemId });
  }

  sendGardenPlace(itemId: string, x: number, y: number): void {
    if (!this.connected) return;
    this.socket.emit('garden:place', { itemId, x, y });
  }

  sendGardenRemove(objectId: string): void {
    if (!this.connected) return;
    this.socket.emit('garden:remove', { objectId });
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  private getOrCreateToken(): string {
    const key = 'afterlight_session';
    let token = localStorage.getItem(key);
    if (!token) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(key, token);
    }
    return token;
  }
}

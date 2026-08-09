import { io, type Socket } from 'socket.io-client';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import type { ClientToServerEvents, ServerToClientEvents } from '@afterlight/protocol';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface NetworkCallbacks {
  onSnapshot: (yourPlayerId: string, players: Array<{ playerId: string; x: number; y: number }>) => void;
  onPlayerJoined: (playerId: string, x: number, y: number) => void;
  onPlayerLeft: (playerId: string) => void;
  onPlayerMoved: (playerId: string, x: number, y: number) => void;
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

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('world:snapshot', (payload) => {
      callbacks.onSnapshot(
        payload.yourPlayerId,
        payload.players.map((p) => ({ playerId: p.playerId, x: p.position.x, y: p.position.y })),
      );
    });

    this.socket.on('player:joined', (payload) => {
      callbacks.onPlayerJoined(payload.playerId, payload.position.x, payload.position.y);
    });

    this.socket.on('player:left', (payload) => {
      callbacks.onPlayerLeft(payload.playerId);
    });

    this.socket.on('player:moved', (payload) => {
      callbacks.onPlayerMoved(payload.playerId, payload.position.x, payload.position.y);
    });

    this.socket.on('error', (payload) => {
      console.error('[network] server error:', payload.code, payload.message);
    });

    this.socket.connect();
  }

  sendMove(dx: number, dy: number, dt: number): void {
    if (!this.connected) return;
    this.socket.emit('player:move', { dx, dy, dt, sequence: ++this.seq });
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

import { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@afterlight/protocol';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import { WorldState } from '../game/worldState';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const world = new WorldState();

export function registerSocketHandlers(io: GameServer): void {
  io.on('connection', (socket: GameSocket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('player:join', (payload) => {
      if (payload.protocolVersion !== PROTOCOL_VERSION) {
        socket.emit('error', {
          code: 'VERSION_MISMATCH',
          message: `Expected protocol v${PROTOCOL_VERSION}`,
          retryable: false,
        });
        return;
      }

      const playerId = socket.id;
      socket.data.playerId = playerId;
      socket.data.sessionToken = payload.sessionToken;

      const alreadyInWorld = world.hasPlayer(playerId);
      const pos = world.addPlayer(playerId);

      socket.emit('world:snapshot', {
        yourPlayerId: playerId,
        players: world.getSnapshot().map((p) => ({
          playerId: p.playerId,
          position: { x: p.x, y: p.y },
        })),
        meteors: [],
        stars: [],
      });

      if (!alreadyInWorld) {
        socket.broadcast.emit('player:joined', {
          playerId,
          position: { x: pos.x, y: pos.y },
        });
        console.log(`[world] player joined: ${playerId} at (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
      }
    });

    socket.on('player:move', (payload) => {
      const playerId = socket.data.playerId;
      if (!playerId) return;

      const mag = Math.sqrt(payload.dx * payload.dx + payload.dy * payload.dy);
      if (!isFinite(mag) || mag > 1.01 || !isFinite(payload.dt)) return;

      const pos = world.movePlayer(playerId, payload.dx, payload.dy, payload.dt);
      if (!pos) return;

      socket.broadcast.emit('player:moved', {
        playerId,
        position: { x: pos.x, y: pos.y },
        sequence: payload.sequence,
      });
    });

    socket.on('meteor:create', (_payload) => {
      // Stage 3
    });

    socket.on('meteor:acknowledge', (_payload) => {
      // Stage 3
    });

    socket.on('player:interact', (_payload) => {
      // Stage 3
    });

    socket.on('disconnect', (reason) => {
      const playerId = socket.data.playerId;
      if (playerId) {
        world.removePlayer(playerId);
        io.emit('player:left', { playerId });
        console.log(`[world] player left: ${playerId} reason=${reason}`);
      }
    });
  });
}

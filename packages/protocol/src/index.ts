import type { MeteorCategory, ResonanceResponseType, Position } from '@afterlight/shared-types';

export const PROTOCOL_VERSION = 1;

// ─── Client → Server ────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  'player:join': (payload: PlayerJoinPayload) => void;
  'player:move': (payload: PlayerMovePayload) => void;
  'meteor:create': (payload: MeteorCreatePayload) => void;
  'meteor:acknowledge': (payload: MeteorAcknowledgePayload) => void;
  'player:interact': (payload: PlayerInteractPayload) => void;
}

export interface PlayerJoinPayload {
  sessionToken: string;
  protocolVersion: number;
}

export interface PlayerMovePayload {
  dx: number;      // normalised movement vector component, -1 to 1
  dy: number;
  dt: number;      // frame delta in seconds (server clamps to MAX_DT)
  sequence: number;
}

export interface MeteorCreatePayload {
  category: MeteorCategory;
  content: string;
}

export interface MeteorAcknowledgePayload {
  meteorId: string;
  responseType: ResonanceResponseType;
}

export interface PlayerInteractPayload {
  entityId: string;
}

// ─── Server → Client ────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  'world:snapshot': (payload: WorldSnapshotPayload) => void;
  'player:joined': (payload: PlayerJoinedPayload) => void;
  'player:left': (payload: PlayerLeftPayload) => void;
  'player:moved': (payload: PlayerMovedPayload) => void;
  'meteor:created': (payload: MeteorCreatedPayload) => void;
  'meteor:acknowledged': (payload: MeteorAcknowledgedPayload) => void;
  'star:created': (payload: StarCreatedPayload) => void;
  'light:earned': (payload: LightEarnedPayload) => void;
  'notification:heard': (payload: NotificationHeardPayload) => void;
  error: (payload: ErrorPayload) => void;
}

export interface WorldSnapshotPayload {
  yourPlayerId: string;
  players: PlayerState[];
  meteors: PublicMeteor[];
  stars: StarState[];
}

export interface PlayerState {
  playerId: string;
  position: Position;
}

export interface PublicMeteor {
  meteorId: string;
  category: MeteorCategory;
  content: string;
  position: Position;
}

export interface StarState {
  starId: string;
  meteorId: string;
  position: Position;
}

export interface PlayerJoinedPayload {
  playerId: string;
  position: Position;
}

export interface PlayerLeftPayload {
  playerId: string;
}

export interface PlayerMovedPayload {
  playerId: string;
  position: Position;
  sequence: number;
}

export interface MeteorCreatedPayload {
  meteorId: string;
  category: MeteorCategory;
  content: string;
  position: Position;
}

export interface MeteorAcknowledgedPayload {
  meteorId: string;
  responseType: ResonanceResponseType;
  transformedAt: string;
}

export interface StarCreatedPayload {
  starId: string;
  meteorId: string;
  position: Position;
}

export interface LightEarnedPayload {
  amount: number;
  reason: 'meteor_acknowledgment';
}

export interface NotificationHeardPayload {
  meteorId: string;
  message: 'Someone heard you.';
}

export interface ErrorPayload {
  code: string;
  message: string;
  retryable: boolean;
}

// ─── Inter-server data (Socket.IO internal) ─────────────────────────────────

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId: string;
  sessionToken: string;
}

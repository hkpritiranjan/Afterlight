export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  x: number;
  y: number;
}

export interface Camera {
  x: number;
  y: number;
}

export interface MovementVector {
  dx: number;
  dy: number;
}

/** Placeholder for meteor locations. Stage 3 will populate these from the server. */
export interface InteractionZone {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface GameState {
  player: PlayerState;
  interactionZones: readonly InteractionZone[];
  nearbyZoneId: string | null;
  tick: number;
}

export interface RemotePlayer {
  playerId: string;
  x: number;       // current rendered position (interpolated toward target)
  y: number;
  targetX: number; // authoritative position from server
  targetY: number;
}

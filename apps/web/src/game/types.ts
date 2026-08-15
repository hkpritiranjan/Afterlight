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

export type MeteorCategory = 'burden' | 'moment' | 'hope' | 'gratitude';
export type ResonanceResponseType =
  | 'i_feel_this_too'
  | 'you_are_not_alone'
  | 'hope_things_get_lighter'
  | 'one_day_at_a_time'
  | 'glad_you_shared';

export interface MeteorEntity {
  meteorId: string;
  category: MeteorCategory;
  content: string;
  x: number;
  y: number;
}

export interface StarEntity {
  starId: string;
  meteorId: string;
  x: number;
  y: number;
}

export type FormState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'read'; meteor: MeteorEntity };

export type { GardenSymbol, CatalogItem, OwnedItem, GardenObject } from '@afterlight/shared-types';

export interface GameCallbacks {
  onFormChange: (state: FormState) => void;
  onNotification: (message: string) => void;
  onLightUpdate: (balance: number) => void;
  onCatalogReady: (catalog: import('@afterlight/shared-types').CatalogItem[]) => void;
  onShopBought: (item: import('@afterlight/shared-types').CatalogItem, lightBalance: number, ownedItems: import('@afterlight/shared-types').OwnedItem[]) => void;
  onGardenChanged: (gardenObjects: import('@afterlight/shared-types').GardenObject[]) => void;
  onOnlineCountChange: (count: number) => void;
  onMeteorsChanged: (meteors: MeteorEntity[]) => void;
  onStarsChanged: (stars: StarEntity[]) => void;
}

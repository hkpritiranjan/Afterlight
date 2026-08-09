export type MeteorCategory = 'burden' | 'moment' | 'hope' | 'gratitude';

export type MeteorStatus =
  | 'draft'
  | 'safety_check'
  | 'published'
  | 'encountered'
  | 'acknowledged'
  | 'star';

export type SafetyStatus = 'pending' | 'safe' | 'sensitive' | 'high_risk';

export type ResonanceResponseType =
  | 'i_feel_this_too'
  | 'you_are_not_alone'
  | 'hope_things_get_lighter'
  | 'one_day_at_a_time'
  | 'glad_you_shared';

export type LightReason = 'meteor_acknowledgment';

export type PlayerStatus = 'active' | 'inactive' | 'banned';

export interface Position {
  x: number;
  y: number;
}

export const METEOR_CONTENT_MAX_LENGTH = 280;

export const RESONANCE_RESPONSES: Record<ResonanceResponseType, string> = {
  i_feel_this_too: 'I feel this too.',
  you_are_not_alone: "You're not alone.",
  hope_things_get_lighter: 'I hope things get lighter.',
  one_day_at_a_time: 'Take it one day at a time.',
  glad_you_shared: "I'm glad you shared this.",
};

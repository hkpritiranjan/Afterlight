import type { SafetyStatus } from '@afterlight/shared-types';

const HIGH_RISK = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'self harm',
  'self-harm', 'cutting myself', 'overdose', 'hurt myself',
];

const SENSITIVE = [
  'depressed', 'depression', 'anxiety', 'panic attack', 'eating disorder',
  'anorexia', 'bulimia', 'trauma', 'abuse', 'assault', 'addiction',
];

export function classify(content: string): SafetyStatus {
  const lower = content.toLowerCase();
  if (HIGH_RISK.some((k) => lower.includes(k))) return 'high_risk';
  if (SENSITIVE.some((k) => lower.includes(k))) return 'sensitive';
  return 'safe';
}

import { describe, it, expect } from 'vitest';
import { classify } from '../src/safety/classifier';

describe('classify', () => {
  it('returns safe for innocuous content', () => {
    expect(classify('Feeling grateful for the sunrise today.')).toBe('safe');
    expect(classify('I hope tomorrow is better.')).toBe('safe');
    expect(classify('Sometimes life feels heavy.')).toBe('safe');
  });

  it('returns sensitive for mental health keywords', () => {
    expect(classify('Struggling with depression lately.')).toBe('sensitive');
    expect(classify('My anxiety is overwhelming.')).toBe('sensitive');
    expect(classify('Living with trauma is hard.')).toBe('sensitive');
  });

  it('returns high_risk for crisis keywords', () => {
    expect(classify('I want to kill myself.')).toBe('high_risk');
    expect(classify('thinking about suicide')).toBe('high_risk');
    expect(classify('I want to end my life.')).toBe('high_risk');
  });

  it('is case-insensitive', () => {
    expect(classify('SUICIDE')).toBe('high_risk');
    expect(classify('DEPRESSION')).toBe('sensitive');
    expect(classify('Happy thoughts!')).toBe('safe');
  });

  it('high_risk takes priority over sensitive when both present', () => {
    expect(classify('my depression made me want to kill myself')).toBe('high_risk');
  });

  it('handles empty-ish content', () => {
    expect(classify('')).toBe('safe');
    expect(classify('   ')).toBe('safe');
  });
});

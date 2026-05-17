import { describe, it, expect } from 'vitest';
import { getMoveVector, isNearby, aabbOverlap } from './math.js';

describe('getMoveVector', () => {
  it('returns zero vector when no keys pressed', () => {
    const v = getMoveVector({ w: false, a: false, s: false, d: false });
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });

  it('returns a unit-length vector for a single key', () => {
    const v = getMoveVector({ w: true, a: false, s: false, d: false });
    const len = Math.sqrt(v.x ** 2 + v.z ** 2);
    expect(len).toBeCloseTo(1, 5);
  });

  it('returns unit length for diagonal (two keys)', () => {
    const v = getMoveVector({ w: true, a: false, s: false, d: true });
    const len = Math.sqrt(v.x ** 2 + v.z ** 2);
    expect(len).toBeCloseTo(1, 5);
  });

  it('W and S cancel out to zero', () => {
    const v = getMoveVector({ w: true, a: false, s: true, d: false });
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });

  it('A and D cancel out to zero', () => {
    const v = getMoveVector({ w: false, a: true, s: false, d: true });
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });
});

describe('isNearby', () => {
  it('returns true when distance is within radius', () => {
    expect(isNearby(0, 0, 1, 0, 2)).toBe(true);
  });

  it('returns false when distance exceeds radius', () => {
    expect(isNearby(0, 0, 3, 0, 2)).toBe(false);
  });

  it('returns true when exactly at radius boundary', () => {
    expect(isNearby(0, 0, 2, 0, 2)).toBe(true);
  });
});

describe('aabbOverlap', () => {
  // args: (ax, az, aw, ad, bx, bz, bw, bd)
  it('detects overlapping boxes', () => {
    expect(aabbOverlap(0, 0, 2, 2, 1, 0, 2, 2)).toBe(true);
  });

  it('returns false for separated boxes', () => {
    expect(aabbOverlap(0, 0, 1, 1, 3, 0, 1, 1)).toBe(false);
  });

  it('returns false for boxes that only touch at edge', () => {
    expect(aabbOverlap(0, 0, 2, 2, 2, 0, 2, 2)).toBe(false);
  });
});

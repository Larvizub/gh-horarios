import { describe, expect, it } from 'vitest';
import { completeTimeValue, parseMilitaryTimeValue } from './TimeInput';

describe('TimeInput military time parsing', () => {
  it('interprets 830 as 08:30', () => {
    expect(parseMilitaryTimeValue('830')).toEqual({ hours: '08', minutes: '30' });
    expect(completeTimeValue('830')).toBe('08:30');
  });

  it('keeps valid military hours and rejects invalid ones', () => {
    expect(parseMilitaryTimeValue('2359')).toEqual({ hours: '23', minutes: '59' });
    expect(parseMilitaryTimeValue('836')).toEqual({ hours: '08', minutes: '36' });
    expect(parseMilitaryTimeValue('83')).toBeNull();
    expect(parseMilitaryTimeValue('2360')).toBeNull();
  });
});
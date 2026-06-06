import { describe, it, expect } from 'vitest';
import {
  pixReducer,
  canGenerateLink,
  type PixMachineState,
} from '../pix-state-machine';

const initial: PixMachineState = { phase: 'idle' };

describe('canGenerateLink gate', () => {
  it('disabled when no type', () => {
    expect(canGenerateLink('', '52998224725')).toBe(false);
    expect(canGenerateLink(undefined, '52998224725')).toBe(false);
  });
  it('disabled when value invalid', () => {
    expect(canGenerateLink('cpf', '111')).toBe(false);
    expect(canGenerateLink('telefone', '123')).toBe(false);
    expect(canGenerateLink('email', 'nope')).toBe(false);
  });
  it('enabled when type+value are valid', () => {
    expect(canGenerateLink('cpf', '52998224725')).toBe(true);
    expect(canGenerateLink('telefone', '(11) 98765-4321')).toBe(true);
    expect(canGenerateLink('email', 'a@b.co')).toBe(true);
  });
});

describe('Pix state machine transitions', () => {
  it('SUBMIT with invalid key transitions to error', () => {
    const next = pixReducer(initial, { type: 'SUBMIT', pixType: 'cpf', value: '111' });
    expect(next.phase).toBe('error');
    expect(next.error).toMatch(/inválida/i);
  });

  it('CPF SUBMIT → generating → ready (link)', () => {
    const s1 = pixReducer(initial, {
      type: 'SUBMIT',
      pixType: 'cpf',
      value: '52998224725',
    });
    expect(s1.phase).toBe('generating');
    expect(s1.type).toBe('cpf');

    const s2 = pixReducer(s1, { type: 'LINK_GENERATED', link: 'https://x/y' });
    expect(s2.phase).toBe('ready');
    expect(s2.link).toBe('https://x/y');
    expect(s2.error).toBeUndefined();
  });

  it('non-CPF flow goes through ANALYSIS_DONE before ready', () => {
    const s1 = pixReducer(initial, {
      type: 'SUBMIT',
      pixType: 'email',
      value: 'a@b.co',
    });
    expect(s1.phase).toBe('generating');
    const s2 = pixReducer(s1, { type: 'ANALYSIS_DONE', link: 'https://z' });
    expect(s2.phase).toBe('ready');
    expect(s2.link).toBe('https://z');
  });

  it('FAIL transitions to error and preserves type/value for retry', () => {
    const s1 = pixReducer(initial, {
      type: 'SUBMIT',
      pixType: 'cpf',
      value: '52998224725',
    });
    const s2 = pixReducer(s1, { type: 'FAIL', error: 'Network down' });
    expect(s2.phase).toBe('error');
    expect(s2.error).toBe('Network down');
    expect(s2.type).toBe('cpf');
    expect(s2.value).toBe('52998224725');
  });

  it('RETRY from error returns to generating and clears error', () => {
    const errored: PixMachineState = {
      phase: 'error',
      type: 'cpf',
      value: '52998224725',
      error: 'boom',
    };
    const next = pixReducer(errored, { type: 'RETRY' });
    expect(next.phase).toBe('generating');
    expect(next.error).toBeUndefined();
  });

  it('RETRY without prior key is a no-op', () => {
    const next = pixReducer(initial, { type: 'RETRY' });
    expect(next).toEqual(initial);
  });

  it('RESET wipes back to idle', () => {
    const ready: PixMachineState = {
      phase: 'ready',
      type: 'cpf',
      value: '52998224725',
      link: 'x',
    };
    expect(pixReducer(ready, { type: 'RESET' })).toEqual({ phase: 'idle' });
  });
});
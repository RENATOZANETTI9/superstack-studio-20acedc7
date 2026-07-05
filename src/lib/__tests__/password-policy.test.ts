import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  passwordResetSchema,
  evaluatePassword,
  PASSWORD_MIN_LENGTH,
} from '@/lib/password-policy';

describe('passwordSchema', () => {
  it('rejeita senha curta', () => {
    const r = passwordSchema.safeParse('Ab1!');
    expect(r.success).toBe(false);
  });

  it('rejeita sem letra maiúscula', () => {
    const r = passwordSchema.safeParse('abcdef1!');
    expect(r.success).toBe(false);
  });

  it('rejeita sem letra minúscula', () => {
    const r = passwordSchema.safeParse('ABCDEF1!');
    expect(r.success).toBe(false);
  });

  it('rejeita sem número', () => {
    const r = passwordSchema.safeParse('Abcdefgh!');
    expect(r.success).toBe(false);
  });

  it('rejeita sem caractere especial', () => {
    const r = passwordSchema.safeParse('Abcdefg1');
    expect(r.success).toBe(false);
  });

  it('aceita senha válida', () => {
    const r = passwordSchema.safeParse('Senha@123');
    expect(r.success).toBe(true);
  });

  it('respeita tamanho mínimo configurado', () => {
    expect(PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(8);
  });
});

describe('passwordResetSchema', () => {
  it('rejeita se confirmação não coincide', () => {
    const r = passwordResetSchema.safeParse({ password: 'Senha@123', confirm: 'Outra@123' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.errors.some((e) => e.path[0] === 'confirm')).toBe(true);
    }
  });

  it('aceita quando senhas coincidem e política é atendida', () => {
    const r = passwordResetSchema.safeParse({ password: 'Senha@123', confirm: 'Senha@123' });
    expect(r.success).toBe(true);
  });
});

describe('evaluatePassword', () => {
  it('reporta score 0 para vazio', () => {
    expect(evaluatePassword('').score).toBe(0);
  });

  it('reporta score 5 para senha completa', () => {
    expect(evaluatePassword('Senha@123').score).toBe(5);
  });

  it('marca checks individuais corretamente', () => {
    const { checks } = evaluatePassword('abc');
    expect(checks.lowercase).toBe(true);
    expect(checks.uppercase).toBe(false);
    expect(checks.number).toBe(false);
    expect(checks.special).toBe(false);
    expect(checks.length).toBe(false);
  });
});
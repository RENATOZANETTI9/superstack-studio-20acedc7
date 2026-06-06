import { describe, it, expect } from 'vitest';
import {
  isValidCPF,
  isValidPhone,
  isValidEmail,
  isValidPixKey,
  maskCPF,
  maskPhone,
  maskEmail,
  applyMask,
  detectPixKeyType,
  pixTypeLabel,
  pixPlaceholder,
} from '../pix-validation';

describe('CPF validation', () => {
  it('accepts a valid CPF', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('rejects invalid CPFs', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false); // all-equal
    expect(isValidCPF('123.456.789-00')).toBe(false); // wrong DV
    expect(isValidCPF('123')).toBe(false);            // too short
    expect(isValidCPF('')).toBe(false);
  });
});

describe('Phone validation', () => {
  it('accepts 10 and 11-digit phones', () => {
    expect(isValidPhone('(11) 9876-5432')).toBe(true);   // 10 digits
    expect(isValidPhone('(11) 98765-4321')).toBe(true);  // 11 digits
  });
  it('rejects shorter/longer phones', () => {
    expect(isValidPhone('11987')).toBe(false);
    expect(isValidPhone('119876543210')).toBe(false);
  });
});

describe('Email validation', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('foo.bar+baz@dom.co')).toBe(true);
  });
  it('rejects malformed emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('@nope.com')).toBe(false);
  });
});

describe('isValidPixKey dispatches by type', () => {
  it('uses CPF rules for cpf', () => {
    expect(isValidPixKey('cpf', '529.982.247-25')).toBe(true);
    expect(isValidPixKey('cpf', '111.111.111-11')).toBe(false);
  });
  it('uses phone rules for telefone', () => {
    expect(isValidPixKey('telefone', '(11) 98765-4321')).toBe(true);
    expect(isValidPixKey('telefone', '123')).toBe(false);
  });
  it('uses email rules for email', () => {
    expect(isValidPixKey('email', 'a@b.co')).toBe(true);
    expect(isValidPixKey('email', 'invalid')).toBe(false);
  });
});

describe('Masks apply progressively', () => {
  it('masks CPF', () => {
    expect(maskCPF('52998224725')).toBe('529.982.247-25');
    expect(maskCPF('529')).toBe('529');
    expect(maskCPF('5299')).toBe('529.9');
  });
  it('masks phone', () => {
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
    expect(maskPhone('1198765432')).toBe('(11) 9876-5432');
  });
  it('masks email (trim + lower)', () => {
    expect(maskEmail('  User@Example.COM ')).toBe('user@example.com');
  });
  it('applyMask dispatches by type', () => {
    expect(applyMask('cpf', '52998224725')).toBe('529.982.247-25');
    expect(applyMask('telefone', '11987654321')).toBe('(11) 98765-4321');
    expect(applyMask('email', 'A@B.CO')).toBe('a@b.co');
  });
});

describe('detectPixKeyType heuristic', () => {
  it('detects email by @', () => {
    expect(detectPixKeyType('a@b.co')).toBe('email');
  });
  it('detects CPF when formatted with dots/dashes (11 digits)', () => {
    expect(detectPixKeyType('529.982.247-25')).toBe('cpf');
  });
  it('detects phone when parens present', () => {
    expect(detectPixKeyType('(11) 98765-4321')).toBe('telefone');
  });
  it('returns null for empty', () => {
    expect(detectPixKeyType('')).toBe(null);
  });
});

describe('UI label helpers', () => {
  it('pixTypeLabel returns Portuguese label', () => {
    expect(pixTypeLabel('cpf')).toBe('CPF');
    expect(pixTypeLabel('telefone')).toBe('Telefone');
    expect(pixTypeLabel('email')).toBe('E-mail');
  });
  it('pixPlaceholder returns appropriate hint', () => {
    expect(pixPlaceholder('cpf')).toMatch(/000/);
    expect(pixPlaceholder('telefone')).toMatch(/\(00\)/);
    expect(pixPlaceholder('email')).toContain('@');
  });
});
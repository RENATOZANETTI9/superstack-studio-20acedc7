export type PixKeyType = 'cpf' | 'telefone' | 'email';

export const maskCPF = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

export const maskEmail = (v: string) => v.trim().toLowerCase().slice(0, 255);

export const applyMask = (type: PixKeyType, v: string) => {
  if (type === 'cpf') return maskCPF(v);
  if (type === 'telefone') return maskPhone(v);
  return maskEmail(v);
};

// Mod 11 CPF validation
export const isValidCPF = (raw: string): boolean => {
  const cpf = raw.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
};

export const isValidPhone = (raw: string): boolean => {
  const d = raw.replace(/\D/g, '');
  return d.length === 10 || d.length === 11;
};

export const isValidEmail = (raw: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());

export const isValidPixKey = (type: PixKeyType, value: string): boolean => {
  if (!value) return false;
  if (type === 'cpf') return isValidCPF(value);
  if (type === 'telefone') return isValidPhone(value);
  return isValidEmail(value);
};

export const pixPlaceholder = (type: PixKeyType) =>
  type === 'cpf' ? '000.000.000-00' : type === 'telefone' ? '(00) 00000-0000' : 'email@exemplo.com';

export const pixTypeLabel = (type: PixKeyType): string =>
  type === 'cpf' ? 'CPF' : type === 'telefone' ? 'Telefone' : 'E-mail';

// Detect type from raw user input (used for auto-revalidation when user edits)
export const detectPixKeyType = (raw: string): PixKeyType | null => {
  const v = raw.trim();
  if (!v) return null;
  if (v.includes('@')) return 'email';
  const digits = v.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 11) {
    // 11 digits could be CPF or mobile phone. Distinguish:
    // - CPF formatted often contains "." or "-"
    // - phone formatted often contains "(" or ")"
    if (/[()]/.test(v)) return 'telefone';
    if (/[.\-]/.test(v) && digits.length === 11) return 'cpf';
    // Heuristic: a valid 11-digit CPF passes mod11; otherwise treat as phone
    if (digits.length === 11 && isValidCPF(digits)) return 'cpf';
    return 'telefone';
  }
  return null;
};
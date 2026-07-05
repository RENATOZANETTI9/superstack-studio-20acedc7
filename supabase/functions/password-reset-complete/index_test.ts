import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Reimplementa a política do index.ts para testar sem dependências externas
const PASSWORD_MIN = 8;
function validatePassword(pw: string): string | null {
  if (typeof pw !== 'string') return 'Senha inválida';
  if (pw.length < PASSWORD_MIN) return `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres`;
  if (!/[a-z]/.test(pw)) return 'A senha deve conter pelo menos uma letra minúscula';
  if (!/[A-Z]/.test(pw)) return 'A senha deve conter pelo menos uma letra maiúscula';
  if (!/[0-9]/.test(pw)) return 'A senha deve conter pelo menos um número';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'A senha deve conter pelo menos um caractere especial';
  return null;
}

function tokenFingerprint(claims: Record<string, unknown>): string {
  const sid = claims.session_id ?? claims.sid ?? null;
  if (typeof sid === 'string' && sid.length > 0) return sid;
  const sub = String(claims.sub ?? '');
  const iat = String(claims.iat ?? '');
  return `${sub}:${iat}`;
}

function isExpired(claims: { exp?: number }, nowMs = Date.now()): boolean {
  const exp = Number(claims.exp ?? 0);
  return !!(exp && exp * 1000 < nowMs);
}

// Simula um "storage" in-memory de tokens usados para exercitar a lógica single-use
class UsedTokenStore {
  private set = new Set<string>();
  isUsed(id: string) { return this.set.has(id); }
  markUsed(id: string) { this.set.add(id); }
}

Deno.test('validatePassword: aceita senha que atende à política', () => {
  assertEquals(validatePassword('Senha@123'), null);
});

Deno.test('validatePassword: rejeita senha curta', () => {
  assertEquals(validatePassword('Ab1!'), `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres`);
});

Deno.test('validatePassword: exige maiúscula, minúscula, número, especial', () => {
  assertEquals(validatePassword('abcdefgh'), 'A senha deve conter pelo menos uma letra maiúscula');
  assertEquals(validatePassword('ABCDEFGH'), 'A senha deve conter pelo menos uma letra minúscula');
  assertEquals(validatePassword('Abcdefgh'), 'A senha deve conter pelo menos um número');
  assertEquals(validatePassword('Abcdefg1'), 'A senha deve conter pelo menos um caractere especial');
});

Deno.test('tokenFingerprint: usa session_id quando disponível', () => {
  const fp = tokenFingerprint({ session_id: 'sess-abc', sub: 'u1', iat: 123 });
  assertEquals(fp, 'sess-abc');
});

Deno.test('tokenFingerprint: cai para sub:iat quando sem session_id', () => {
  const fp = tokenFingerprint({ sub: 'u1', iat: 123 });
  assertEquals(fp, 'u1:123');
});

Deno.test('isExpired: detecta token expirado', () => {
  // exp em segundos; simulamos "agora" à frente do exp
  const past = { exp: Math.floor(Date.now() / 1000) - 10 };
  assertEquals(isExpired(past), true);
});

Deno.test('isExpired: aceita token com exp no futuro', () => {
  const future = { exp: Math.floor(Date.now() / 1000) + 3600 };
  assertEquals(isExpired(future), false);
});

Deno.test('single-use: token já utilizado é bloqueado numa segunda tentativa', () => {
  const store = new UsedTokenStore();
  const claims = { session_id: 'sess-xyz', sub: 'u1', iat: 1, exp: Math.floor(Date.now() / 1000) + 60 };
  const fp = tokenFingerprint(claims);

  // Primeira tentativa: ainda não usado → passa
  assertEquals(store.isUsed(fp), false);
  store.markUsed(fp);

  // Segunda tentativa com o MESMO token → bloqueada
  assertEquals(store.isUsed(fp), true);
});

Deno.test('single-use: tokens diferentes (session_ids distintos) são independentes', () => {
  const store = new UsedTokenStore();
  store.markUsed(tokenFingerprint({ session_id: 'a' }));
  assertEquals(store.isUsed(tokenFingerprint({ session_id: 'b' })), false);
});

Deno.test('fluxo integrado: expirado bloqueia antes de checar single-use', () => {
  const store = new UsedTokenStore();
  const expiredClaims = { session_id: 'exp-1', exp: Math.floor(Date.now() / 1000) - 1 };
  // Simula a ordem do edge function: primeiro expiração, depois single-use.
  const isExp = isExpired(expiredClaims);
  const isReused = store.isUsed(tokenFingerprint(expiredClaims));
  assertEquals(isExp, true);
  assertEquals(isReused, false);
  // Comportamento esperado: rejeitar por expiração; token não é marcado usado.
});
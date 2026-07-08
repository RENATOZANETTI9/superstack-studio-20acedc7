import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration test for public.perf_alerts RLS policies.
 *
 * Confirms:
 *  - a regular user (representante A) inserts and reads only its own rows
 *  - a second regular user (representante B) cannot read A's rows
 *  - an admin or master user reads across users
 *
 * Requires the following env vars — otherwise the suite is skipped so CI
 * without seed data doesn't break:
 *  - VITE_SUPABASE_URL
 *  - VITE_SUPABASE_PUBLISHABLE_KEY
 *  - REP_EMAIL / REP_PASS         (representante A)
 *  - REP2_EMAIL / REP2_PASS       (representante B — different user)
 *  - ADMIN_EMAIL / ADMIN_PASS     (admin or master)
 */

// Vite exposes env vars via import.meta.env; also read from a globalThis
// process.env when running under Node/CI so we don't depend on @types/node.
const env: Record<string, string | undefined> =
  (globalThis as any).process?.env ?? {};
const url =
  (import.meta as any).env?.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
const anon =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.VITE_SUPABASE_PUBLISHABLE_KEY;

const repEmail = env.REP_EMAIL;
const repPass = env.REP_PASS;
const rep2Email = env.REP2_EMAIL;
const rep2Pass = env.REP2_PASS;
const adminEmail = env.ADMIN_EMAIL;
const adminPass = env.ADMIN_PASS;

const hasAll =
  !!url && !!anon &&
  !!repEmail && !!repPass &&
  !!rep2Email && !!rep2Pass &&
  !!adminEmail && !!adminPass;

function client() {
  return createClient(url!, anon!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function signIn(email: string, password: string): Promise<{ client: SupabaseClient; userId: string }> {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`sign-in failed for ${email}: ${error?.message}`);
  return { client: c, userId: data.user.id };
}

// Unique label per test-run so we don't collide with prior data.
const RUN_TAG = `rls-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe.skipIf(!hasAll)('perf_alerts — RLS', () => {
  let repA: { client: SupabaseClient; userId: string };
  let repB: { client: SupabaseClient; userId: string };
  let admin: { client: SupabaseClient; userId: string };

  beforeAll(async () => {
    repA = await signIn(repEmail!, repPass!);
    repB = await signIn(rep2Email!, rep2Pass!);
    admin = await signIn(adminEmail!, adminPass!);

    // Seed one perf_alert per user, tagged with RUN_TAG in the source field
    // so we can filter deterministically without stepping on other data.
    const seed = async (c: SupabaseClient, uid: string, who: string) => {
      const { error } = await c.from('perf_alerts').insert({
        user_id: uid,
        source: `${RUN_TAG}:${who}`,
        label: 'rls.probe',
        duration_ms: 999,
        budget_ms: 500,
        context: { tag: RUN_TAG, who },
      });
      if (error) throw new Error(`seed insert failed for ${who}: ${error.message}`);
    };
    await seed(repA.client, repA.userId, 'repA');
    await seed(repB.client, repB.userId, 'repB');
  });

  afterAll(async () => {
    // Best-effort cleanup via admin (may not have DELETE grant — that's ok).
    if (admin?.client) {
      await admin.client.from('perf_alerts').delete().like('source', `${RUN_TAG}:%`);
    }
    await repA?.client.auth.signOut();
    await repB?.client.auth.signOut();
    await admin?.client.auth.signOut();
  });

  it('representante A reads only its own perf_alerts for this run', async () => {
    const { data, error } = await repA.client
      .from('perf_alerts')
      .select('user_id, source')
      .like('source', `${RUN_TAG}:%`);
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.length).toBe(1);
    expect(data![0].user_id).toBe(repA.userId);
    expect(data![0].source).toBe(`${RUN_TAG}:repA`);
  });

  it('representante B cannot read A\u2019s perf_alerts', async () => {
    const { data, error } = await repB.client
      .from('perf_alerts')
      .select('user_id, source')
      .like('source', `${RUN_TAG}:%`);
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    // Only sees its own seed row — never A's.
    expect(data!.every((row) => row.user_id === repB.userId)).toBe(true);
    expect(data!.some((row) => row.source === `${RUN_TAG}:repA`)).toBe(false);
  });

  it('representante cannot insert a perf_alert impersonating another user', async () => {
    const { error } = await repA.client.from('perf_alerts').insert({
      user_id: repB.userId, // wrong owner → must be blocked by WITH CHECK
      source: `${RUN_TAG}:spoof`,
      label: 'rls.spoof',
      duration_ms: 1,
      budget_ms: 500,
      context: { tag: RUN_TAG },
    });
    expect(error).not.toBeNull();
    expect(error!.message.toLowerCase()).toMatch(/row-level security|violates|policy/);
  });

  it('admin/master reads across users for this run (both A and B)', async () => {
    const { data, error } = await admin.client
      .from('perf_alerts')
      .select('user_id, source')
      .like('source', `${RUN_TAG}:%`);
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    const owners = new Set(data!.map((r) => r.user_id));
    expect(owners.has(repA.userId)).toBe(true);
    expect(owners.has(repB.userId)).toBe(true);
  });
});

describe.skipIf(hasAll)('perf_alerts — RLS (skipped)', () => {
  it('needs REP/REP2/ADMIN seed credentials to run', () => {
    expect(hasAll).toBe(false);
  });
});
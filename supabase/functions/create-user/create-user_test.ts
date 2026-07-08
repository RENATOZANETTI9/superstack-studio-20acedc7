// Static verification that the create-user edge function assigns the
// 'representante' role to newly created accounts. Run with:
//   deno test supabase/functions/create-user/create-user_test.ts
import { assert, assertMatch } from 'https://deno.land/std@0.208.0/assert/mod.ts';

const source = await Deno.readTextFile(new URL('./index.ts', import.meta.url));

Deno.test("create-user inserts role: 'representante' into user_roles", () => {
  assertMatch(
    source,
    /\.from\(['"]user_roles['"]\)\s*\.insert\(\s*\{[^}]*role:\s*['"]representante['"][^}]*\}/,
    "user_roles insert must set role to 'representante'",
  );
});

Deno.test("create-user does not fall back to role: 'user'", () => {
  assert(
    !/\.from\(['"]user_roles['"]\)\s*\.insert\(\s*\{[^}]*role:\s*['"]user['"]/.test(source),
    "user_roles insert must not use role 'user'",
  );
});

Deno.test("create-user still forces must_change_password on the new profile", () => {
  assertMatch(
    source,
    /must_change_password:\s*true/,
    "must_change_password must be enforced for admin-created accounts",
  );
});
-- =============================================================================
-- Index-usage verification for the "Real vs Projetado" queries.
--
-- Runs EXPLAIN (ANALYZE, BUFFERS) against the three hot queries and asserts
-- that the expected indexes are picked by the planner. Fails loudly (via
-- RAISE EXCEPTION) if any query falls back to a Seq Scan.
--
-- Usage:
--   psql "$PGURL" -f scripts/verify-commission-indexes.sql
--
-- Requires the following indexes (created in migration 20260708143418…):
--   * idx_partners_user_id
--   * idx_partner_commissions_beneficiary_month
--   * idx_partner_commissions_beneficiary_paid_at
-- =============================================================================

\set ON_ERROR_STOP on
\timing on

\echo '--- 1. partners lookup by user_id ---------------------------------'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM public.partners
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
LIMIT 1;

\echo '--- 2. month commissions (beneficiary_partner_id + reference_month) --'
EXPLAIN (ANALYZE, BUFFERS)
SELECT status, commission_amount
FROM public.partner_commissions
WHERE beneficiary_partner_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND reference_month = to_char(now(), 'YYYY-MM')
  AND status IN ('CALCULATED', 'APPROVED', 'PAID');

\echo '--- 3. weekly PAID commissions (beneficiary + paid_at partial idx) ---'
EXPLAIN (ANALYZE, BUFFERS)
SELECT commission_amount, paid_at
FROM public.partner_commissions
WHERE beneficiary_partner_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND status = 'PAID'
  AND paid_at >= (now() - interval '7 days');

\echo '--- 4. portfolio clinics (partner_id + created_at desc) --------------'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, nome, status
FROM public.portfolio_clinics
WHERE partner_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at DESC
LIMIT 10;

\echo '--- 5. assertions: every hot query must use an index ----------------'
DO $$
DECLARE
  plan_json jsonb;
  node_types text;
  check_query text;
  label text;
  queries text[][] := ARRAY[
    ARRAY['partners.by_user_id',
          'SELECT id FROM public.partners WHERE user_id = ''00000000-0000-0000-0000-000000000000''::uuid LIMIT 1'],
    ARRAY['commissions.month',
          'SELECT status, commission_amount FROM public.partner_commissions WHERE beneficiary_partner_id = ''00000000-0000-0000-0000-000000000000''::uuid AND reference_month = to_char(now(), ''YYYY-MM'') AND status IN (''CALCULATED'', ''APPROVED'', ''PAID'')'],
    ARRAY['commissions.week',
          'SELECT commission_amount, paid_at FROM public.partner_commissions WHERE beneficiary_partner_id = ''00000000-0000-0000-0000-000000000000''::uuid AND status = ''PAID'' AND paid_at >= (now() - interval ''7 days'')'],
    ARRAY['portfolio.clinics',
          'SELECT id, nome, status FROM public.portfolio_clinics WHERE partner_id = ''00000000-0000-0000-0000-000000000000''::uuid ORDER BY created_at DESC LIMIT 10']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(queries, 1) LOOP
    label := queries[i][1];
    check_query := queries[i][2];
    EXECUTE 'EXPLAIN (FORMAT JSON) ' || check_query INTO plan_json;
    node_types := plan_json::text;
    IF node_types ILIKE '%"Node Type": "Seq Scan"%' THEN
      RAISE EXCEPTION 'Query "%": planner chose Seq Scan — missing/unused index. Plan: %',
        label, node_types;
    END IF;
    RAISE NOTICE 'OK  %  (no Seq Scan detected)', label;
  END LOOP;
END
$$;

\echo 'All hot queries are using indexes.'
# RLS Checklist — Cobertura por Tabela

Documenta quais operações (SELECT / INSERT / UPDATE / DELETE) estão cobertas por policies em cada tabela do schema `public`. Use como referência antes de adicionar novas queries ou migrations, para evitar regressões multi-tenant.

> Legenda: ✅ policy definida · ⚠️ intencionalmente ausente (audit-only ou apenas via `service_role`/cascade) · ❌ falta cobertura (revisar)

## Tabelas transacionais (CRUD completo esperado)

| Tabela | SELECT | INSERT | UPDATE | DELETE | Observações |
|---|:---:|:---:|:---:|:---:|---|
| `contracts` | ✅ | ✅ | ✅ | ✅ | CRUD completo. |
| `partners` | ✅ | ✅ | ✅ | ✅ | DELETE restrito a admin. |
| `partner_system_config` | ✅ | ✅ | ✅ | ✅ | CRUD completo (config global). |
| `portfolio_clinics` | ✅ | ✅ | ✅ | ✅ | `portfolio_update_own` adicionada em 07/2026. Além das 4 policies próprias, existe `admin_portfolio_all` (ALL) para admin/master. |

## Tabelas com CRUD parcial (UPDATE por admin/system apenas)

| Tabela | SELECT | INSERT | UPDATE | DELETE | Observações |
|---|:---:|:---:|:---:|:---:|---|
| `partner_commissions` | ✅ | ✅ | ✅ | ⚠️ | INSERT via edge function (`service_role`). UPDATE só admin/master (baixa de pagamento). DELETE intencionalmente ausente — comissão nunca deve ser removida (compliance financeiro). |
| `partner_clinic_relations` | ✅ | ✅ | ✅ | ⚠️ | DELETE via `ON DELETE CASCADE` de `partners`. Sem policy explícita. |
| `partner_links` | ✅ | ✅ | ✅ | ⚠️ | Links de convite não são removidos manualmente. |
| `partner_alerts` | ✅ | ✅ | ✅ | ⚠️ | Alertas são marcados como lidos (UPDATE), nunca deletados. |
| `partner_metrics_daily` | ✅ | ✅ | ✅ | ⚠️ | Snapshots diários — upsert por job. |
| `partner_network` | ✅ | ✅ | ✅ | ⚠️ | Estrutura hierárquica gerenciada via triggers. |
| `master_network_metrics` | ✅ | ✅ | ✅ | ⚠️ | Métricas agregadas. |
| `attendant_incentives` | ✅ | ✅ | ✅ | ⚠️ | Histórico de incentivos — sem remoção. |
| `scheduled_returns` | ✅ | ✅ | ✅ | ⚠️ | Retornos agendados marcados como concluídos. |
| `profiles` | ✅ | ✅ | ✅ | ⚠️ | DELETE via cascade de `auth.users`. |

## Tabelas somente leitura / append-only (audit-only)

Estas tabelas registram histórico ou eventos imutáveis. **Nunca** adicione policies de UPDATE ou DELETE.

| Tabela | SELECT | INSERT | UPDATE | DELETE | Propósito |
|---|:---:|:---:|:---:|:---:|---|
| `contract_history` | ✅ | ✅ | ⚠️ | ⚠️ | Timeline imutável de mudanças de contrato. |
| `partner_config_history` | ✅ | ✅ | ⚠️ | ⚠️ | Histórico de alterações em `partner_system_config`. |
| `proposal_pix_audit` | ✅ | ✅ | ⚠️ | ⚠️ | Trilha de auditoria PIX. |
| `password_reset_audit` | ✅ | ⚠️ | ⚠️ | ⚠️ | Só leitura via RPC/admin; INSERT via `service_role` na edge function. |
| `used_recovery_tokens` | ✅ | ⚠️ | ⚠️ | ⚠️ | Anti-reuso de tokens de recuperação. Escrita via `service_role`. |
| `password_reset_rate_limits` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Sem policies — acessada exclusivamente por funções `SECURITY DEFINER` / `service_role`. |

## Tabelas com policy ALL (uma única regra cobre tudo)

| Tabela | ALL | Observações |
|---|:---:|---|
| `proposal_pix_states` | ✅ | Estado atômico da máquina PIX — uma policy única cobre CRUD para o dono da proposta. |
| `user_roles` | ✅ (SELECT/INSERT/DELETE via 4 policies) | Sem UPDATE: mudança de papel = revoke + grant. |

---

## Regras para evitar regressão

1. **Antes de criar nova query no client:** consulte esta tabela. Se a operação não está ✅, ou você adiciona a policy correspondente na mesma migration, ou não faça a operação no client (use edge function com `service_role`).
2. **Toda migration `CREATE TABLE public.*`** deve conter, na mesma migration: `GRANT` → `ENABLE RLS` → `CREATE POLICY`.
3. **Não confie apenas em RLS para audit-only tables.** Confirme que nenhum client tem `service_role` — a key só existe em edge functions.
4. **DELETE em tabelas financeiras (`partner_commissions`, `contract_history`, `*_audit`) é proibido por design.** Se precisar "reverter", crie um registro de estorno.
5. **Ao adicionar filtro por `partner_id`/`user_id`** no client, lembre-se que a RLS já isola — o filtro é UX, não segurança.

## Última auditoria

- Data: 07/2026
- Escopo: 21 tabelas do schema `public`
- Findings resolvidos: `portfolio_update_own` adicionada (parceiros agora podem atualizar suas próprias clínicas)
- Findings aceitos: ausência de DELETE em tabelas de histórico e comissões (intencional)
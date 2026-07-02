# Plano: Restrições e Auditoria de Acesso do Representante

Escopo focado no papel `representante` (RBAC). Sem alterações de negócio fora disso.

## 1. Menus e navegação
- **AppSidebar.tsx**: revisar cada item (Dashboard geral, Buscar Crédito, Créditos Aprovados, Consultas, Contratos, Clínicas, Partners/Representantes, Usuários, Config) e ocultar do `representante` tudo que não é permitido. Permitidos: Meu Painel do representante, Minha Rota, Minhas Clínicas (só as dele), Simulador, Bonificações, Perfil, Marketing, Gestão de Usuários (escopo restrito).
- **Bottom nav mobile** (dentro do `DashboardLayout`/sidebar mobile): mesmo filtro por role.
- **Header/atalhos** de "Buscar Crédito" e "Créditos Aprovados": esconder botões/CTAs quando `role === 'representante'`.
- Centralizar a lista de itens permitidos em `partner-rules.ts` via helper `getAllowedMenuKeys(role)` para evitar divergência entre desktop/mobile.

## 2. Tela "Acesso Negado" (403)
- Criar `src/pages/AccessDenied.tsx` com layout consistente (mesma estética glass-card), CTA "Voltar" e link para rota padrão do role.
- Registrar rota `/acesso-negado` em `App.tsx`.
- Ajustar `useRepresentanteGuard` e novos guards para redirecionar para `/acesso-negado` (em vez de silenciosamente para `/dashboard`) quando o representante tentar rota proibida; guard atual de "shared → dashboard" vira "→ /acesso-negado" apenas quando o usuário está autenticado mas sem permissão.
- Guardas equivalentes nas páginas admin usadas pelo representante indevidamente (Consultas, Contratos admin, Usuários admin): criar `useRoleGuard(allowedRoles[])` genérico e aplicar.

## 3. Guard e catch-all — testes
- **Unitários (vitest + RTL)**: `src/hooks/__tests__/useRepresentanteGuard.test.tsx`
  - Para cada role (`admin`, `master`, `master_partner`, `partner`, `representante`, `user`, `cs_geral`, `cs_exclusiva`, `clinic_owner`, `attendant`), em modo `shared` e `admin`, asserta o destino de `navigate` usando `MemoryRouter` + mock de `useAuth`.
- **Unitários**: `src/components/representantes/__tests__/RepresentantesCatchAll.test.tsx`
  - Para cada role, renderiza em `MemoryRouter` com rota desconhecida e verifica `<Navigate>` de destino.
- **E2E (Playwright, e2e/representante-access.spec.ts)**:
  - Login como representante → tenta abrir `/dashboard/representantes/dashboard`, `/dashboard/usuarios/permissoes`, `/dashboard/partners/config`; espera `/acesso-negado` ou `/dashboard/representantes/rota`.
  - Login como admin → todas as rotas acima devem abrir normalmente.
  - Usa sessão Supabase injetada quando disponível; senão, mocka via localStorage.

## 4. Matriz de Auditoria de Permissões
- Nova página `src/pages/usuarios/AuditoriaPermissoes.tsx` (rota `/dashboard/usuarios/auditoria`, admin-only).
- Tabela com colunas: Permissão / CS / SDR / CS+SDR / Representante / Admin / Master Partner / Partner.
- Segunda tabela: Item de menu × Role (✔/✖) gerada a partir do mesmo `getAllowedMenuKeys`.
- Fonte única: derivar de `partner-rules.ts` + `Hierarquias.tsx` (extrair definições para `src/lib/permissions-matrix.ts`).
- Botão "Exportar CSV" da matriz.
- Link no submenu "Gestão de Usuários" para admins.

## 5. Filtros por proprietário (representante)
- Novo helper `useOwnerScope()` que devolve `{ ownerFilter, isRepresentante, representanteId }`.
- Aplicar nos hooks/queries:
  - **Simulações**: `RepresentantesClinicSimulations` / `ClinicSimulationAnalysis` → filtrar por `created_by = user.id` quando representante.
  - **Aprovações / Créditos**: hook de contratos (`useContracts`) → adicionar `.eq('created_by', user.id)` condicional.
  - **Contratos**: idem.
  - **Evolução de clínicas** (`PartnersClinicas` + gráficos): filtrar `partner_clinic_relations` por `owner_user_id = user.id`.
- Backend: garantir RLS coerente — políticas em `contracts`, `partner_clinic_relations`, tabela de simulações — permitindo ao `representante` apenas linhas onde `created_by = auth.uid()`. Migration adiciona coluna `created_by uuid` onde faltar e policies específicas para o role.
- UI: badge "Meus registros" no topo das listas quando filtro estiver ativo.

## 6. Sequência de entrega
1. Extrair matriz e helpers (`permissions-matrix.ts`, `getAllowedMenuKeys`, `useRoleGuard`, `useOwnerScope`).
2. Tela `AccessDenied` + rota + redirecionamentos dos guards.
3. AppSidebar/mobile/header — aplicar filtro; remover CTAs proibidos.
4. Página de Auditoria de Permissões + link no menu.
5. Filtros por dono nas listas e hooks; migration + policies.
6. Testes unitários do guard e catch-all; E2E de acesso.
7. Rodar `bun run build`, `vitest run`, `playwright test` para validar.

## Detalhes técnicos
- Roles considerados: `admin`, `master`, `master_partner`, `partner`, `representante`, `cs_geral`, `cs_exclusiva`, `clinic_owner`, `attendant`, `user`.
- Rota padrão pós-negação por role: representante/partner/master_partner → `/dashboard/representantes/rota`; demais → `/dashboard`.
- `AccessDenied` recebe `?from=` via querystring para logging (console/analytics futuro).
- Nenhuma alteração em `src/integrations/supabase/client.ts` nem em `types.ts` gerados.

Aprovar para eu implementar?

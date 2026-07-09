/**
 * IDs compartilhados usados para conectar o título da seção "Roteiro Gerado
 * pela IA" ao alerta de `format_issues` via `aria-describedby` /
 * `aria-labelledby`. Exportados como constantes para que testes de integração
 * possam validar que o contrato ARIA permanece estável mesmo quando o
 * conteúdo (issues, source, etc.) muda.
 */
export const AI_ROUTE_TITLE_ID = "ai-route-title";
export const AI_FORMAT_ALERT_ID = "ai-format-alert";
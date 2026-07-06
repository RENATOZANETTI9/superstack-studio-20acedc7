INSERT INTO partner_system_config (config_key, config_value, description, category, is_active)
VALUES 
(
  'taxa_comissao_representante',
  '{"rate": 0.0080, "descricao": "0,80% sobre produção paga"}'::jsonb,
  'Taxa de comissão do representante comercial sobre contratos pagos das clínicas do seu portfólio',
  'COMMISSION_RATES',
  true
),
(
  'faixas_mimo_representante',
  '{
    "bronze":   {"min_volume": 25000,  "max_volume": 60000,  "label": "Bronze",   "level": 1, "brinde": "Kit de boas-vindas com material de apoio para a recepção"},
    "prata":    {"min_volume": 61000,  "max_volume": 100000, "label": "Prata",    "level": 2, "brinde": "Voucher de R$ 100 em produtos de escritório"},
    "ouro":     {"min_volume": 101000, "max_volume": 200000, "label": "Ouro",     "level": 3, "brinde": "Smartwatch ou tablet (à escolha do parceiro)"},
    "diamante": {"min_volume": 201000, "max_volume": null,   "label": "Diamante", "level": 4, "brinde": "Viagem ou crédito equivalente de R$ 2.000"}
  }'::jsonb,
  'Faixas de MIMO para representantes baseadas em volume mensal de produção paga',
  'MIMO_TIERS',
  true
)
ON CONFLICT (config_key) DO NOTHING;
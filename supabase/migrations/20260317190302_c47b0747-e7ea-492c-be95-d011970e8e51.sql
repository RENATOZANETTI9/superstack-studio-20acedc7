
-- Expandir enum de roles para suportar novos perfis do módulo Partners
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master_partner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cs_geral';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cs_exclusiva';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinic_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'attendant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

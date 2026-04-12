
CREATE OR REPLACE FUNCTION public.check_partner_promotion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_paid numeric;
  partner_record record;
  new_link_code text;
BEGIN
  -- Only check if partner is not already MASTER (once MASTER, never demoted)
  SELECT * INTO partner_record FROM partners WHERE id = NEW.partner_id;
  
  IF partner_record.type = 'MASTER' THEN
    RETURN NEW;
  END IF;

  -- Sum paid amounts from the last 30 days only
  SELECT COALESCE(SUM(c.amount_released), 0) INTO total_paid
  FROM contracts c
  JOIN partner_clinic_relations pcr ON pcr.clinic_external_id = c.user_id
  WHERE pcr.partner_id = NEW.partner_id 
    AND pcr.is_active = true
    AND c.paid_at >= (now() - interval '30 days');

  IF total_paid >= 30000 THEN
    UPDATE partners SET type = 'MASTER', updated_at = now() WHERE id = NEW.partner_id;
    
    new_link_code := 'PR-' || substr(md5(random()::text), 1, 8);
    
    INSERT INTO partner_links (partner_id, link_type, link_code, link_url)
    VALUES (
      NEW.partner_id,
      'PARTNER_INVITATION',
      new_link_code,
      'https://superstack-studio.lovable.app/register/partner?ref=' || new_link_code
    )
    ON CONFLICT DO NOTHING;
    
    INSERT INTO partner_alerts (partner_id, alert_type, title, description, severity)
    VALUES (
      NEW.partner_id,
      'PROMOTION',
      'Partner promovido a Master Partner',
      'A rede atingiu R$ ' || to_char(total_paid, 'FM999G999D00') || ' em créditos pagos nos últimos 30 dias. Link de recrutamento gerado automaticamente.',
      'LOW'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

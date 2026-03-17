
-- Function to auto-promote partner to MASTER when they reach 20 active clinics
-- Also generates a PARTNER_RECRUITMENT link for them
CREATE OR REPLACE FUNCTION public.check_partner_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_count integer;
  partner_record record;
  new_link_code text;
BEGIN
  -- Count active clinics for this partner
  SELECT COUNT(*) INTO active_count
  FROM partner_clinic_relations
  WHERE partner_id = NEW.partner_id AND is_active = true;

  -- Check if partner qualifies for promotion
  IF active_count >= 20 THEN
    SELECT * INTO partner_record FROM partners WHERE id = NEW.partner_id;
    
    -- Only promote if currently a PARTNER (not already MASTER)
    IF partner_record.type = 'PARTNER' THEN
      -- Promote to MASTER
      UPDATE partners SET type = 'MASTER', updated_at = now() WHERE id = NEW.partner_id;
      
      -- Generate partner recruitment link
      new_link_code := 'PR-' || substr(md5(random()::text), 1, 8);
      
      INSERT INTO partner_links (partner_id, link_type, link_code, link_url)
      VALUES (
        NEW.partner_id,
        'PARTNER_RECRUITMENT',
        new_link_code,
        'https://superstack-studio.lovable.app/register/partner?ref=' || new_link_code
      )
      ON CONFLICT DO NOTHING;
      
      -- Create alert for the promotion
      INSERT INTO partner_alerts (partner_id, alert_type, title, description, severity)
      VALUES (
        NEW.partner_id,
        'PROMOTION',
        'Partner promovido a Master Partner',
        'Atingiu ' || active_count || ' clínicas ativas. Link de recrutamento de partners gerado automaticamente.',
        'LOW'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on clinic relations insert/update
DROP TRIGGER IF EXISTS trg_check_partner_promotion ON partner_clinic_relations;
CREATE TRIGGER trg_check_partner_promotion
  AFTER INSERT OR UPDATE ON partner_clinic_relations
  FOR EACH ROW
  EXECUTE FUNCTION check_partner_promotion();

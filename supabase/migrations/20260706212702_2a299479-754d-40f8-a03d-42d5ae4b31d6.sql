ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET must_change_password = false
WHERE email IN ('joao.cardoso@demo.helpude.com','ana.ferreira@demo.helpude.com','marcos.rocha@demo.helpude.com');
-- Table to store editable mimo tier presentation (name + image) per level.
-- Ranges/levels stay code-managed in MIMO_TIERS; this only overrides the label and adds an image.
CREATE TABLE public.mimo_tiers_customization (
  level integer PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.mimo_tiers_customization TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mimo_tiers_customization TO authenticated;
GRANT ALL ON public.mimo_tiers_customization TO service_role;

ALTER TABLE public.mimo_tiers_customization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mimo tier customization"
  ON public.mimo_tiers_customization FOR SELECT
  USING (true);

CREATE POLICY "Admins, partners and representantes can insert mimo tier customization"
  ON public.mimo_tiers_customization FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'master') OR
    public.has_role(auth.uid(), 'partner') OR
    public.has_role(auth.uid(), 'master_partner') OR
    public.has_role(auth.uid(), 'representante')
  );

CREATE POLICY "Admins, partners and representantes can update mimo tier customization"
  ON public.mimo_tiers_customization FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'master') OR
    public.has_role(auth.uid(), 'partner') OR
    public.has_role(auth.uid(), 'master_partner') OR
    public.has_role(auth.uid(), 'representante')
  );

CREATE POLICY "Admins can delete mimo tier customization"
  ON public.mimo_tiers_customization FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE TRIGGER update_mimo_tiers_customization_updated_at
  BEFORE UPDATE ON public.mimo_tiers_customization
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 4 existing levels with the new default labels.
INSERT INTO public.mimo_tiers_customization (level, name) VALUES
  (1, 'Bronze'),
  (2, 'Prata'),
  (3, 'Ouro'),
  (4, 'Diamante');

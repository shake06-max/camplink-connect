-- Dating reactions (like / dislike)
CREATE TABLE public.dating_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id uuid NOT NULL,
  reactor_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('like','dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_user_id, reactor_id)
);
ALTER TABLE public.dating_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions readable by authenticated" ON public.dating_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own reaction" ON public.dating_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = reactor_id AND NOT public.is_suspended(auth.uid()));
CREATE POLICY "Users update own reaction" ON public.dating_reactions FOR UPDATE TO authenticated USING (auth.uid() = reactor_id);
CREATE POLICY "Users delete own reaction" ON public.dating_reactions FOR DELETE TO authenticated USING (auth.uid() = reactor_id OR public.has_role(auth.uid(),'admin'));

-- Listing reviews (replaces ad-hoc reviews for product reviews)
CREATE TABLE public.listing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listing reviews readable by authenticated" ON public.listing_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own listing reviews" ON public.listing_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT public.is_suspended(auth.uid()));
CREATE POLICY "Users delete own or admin" ON public.listing_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own" ON public.listing_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Anonymous "How was it" surveys (publicly shareable)
CREATE TABLE public.anon_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE DEFAULT substr(md5(random()::text),1,10),
  title text NOT NULL DEFAULT 'How was it?',
  prompt text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anon_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads surveys" ON public.anon_surveys FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone creates survey" ON public.anon_surveys FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.anon_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.anon_surveys(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 10),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anon_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads responses" ON public.anon_responses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone submits response" ON public.anon_responses FOR INSERT TO anon, authenticated WITH CHECK (true);

-- App theme settings (admin customisable)
CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id, theme) VALUES (1, '{}'::jsonb) ON CONFLICT DO NOTHING;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Realtime for theme
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
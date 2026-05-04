-- Multi-photo for dating
ALTER TABLE public.dating_profiles
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

-- Multi-media for listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS subcategory text;

-- Community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'announcement',
  title text NOT NULL,
  body text,
  image_url text,
  location text,
  contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community posts viewable by authenticated"
  ON public.community_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users create own community posts"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_suspended(auth.uid()));

CREATE POLICY "Users update own community posts"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own community posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER community_posts_touch
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notify on new community post
CREATE OR REPLACE FUNCTION public.notify_new_community_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT p.id,
         'New community post: ' || NEW.kind,
         NEW.title,
         'community',
         '/community'
  FROM public.profiles p
  WHERE p.id <> NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_post_notify ON public.community_posts;
CREATE TRIGGER community_post_notify
  AFTER INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_community_post();
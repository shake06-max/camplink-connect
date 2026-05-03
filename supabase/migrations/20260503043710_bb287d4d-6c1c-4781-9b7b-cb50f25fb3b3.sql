
-- Suspension flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- Dating profiles
CREATE TABLE IF NOT EXISTS public.dating_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  age int,
  gender text,
  looking_for text,
  bio text,
  interests text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active dating profiles viewable by authenticated"
  ON public.dating_profiles FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own dating profile"
  ON public.dating_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own dating profile"
  ON public.dating_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own dating profile"
  ON public.dating_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_dating_profiles_updated
  BEFORE UPDATE ON public.dating_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Function: check if user is suspended (used in policies)
CREATE OR REPLACE FUNCTION public.is_suspended(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT suspended FROM public.profiles WHERE id = _user_id), false);
$$;

-- Block suspended users from posting
DROP POLICY IF EXISTS "Users create own listings" ON public.listings;
CREATE POLICY "Users create own listings"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_suspended(auth.uid()));

DROP POLICY IF EXISTS "Users create own reviews" ON public.reviews;
CREATE POLICY "Users create own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_suspended(auth.uid()));

DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b))
  );

-- Allow admins to update profiles (for suspension)
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Allow users to delete their own profile (cascade-ish via trigger below)
CREATE POLICY "Users delete own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatar or admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));

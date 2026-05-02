
-- ============ STORAGE BUCKET FOR LISTING PHOTOS ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Listing photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');

CREATE POLICY "Users upload own listing photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own listing photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own listing photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-photos'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'system',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins or self can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ============ CART ITEMS ============
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cart" ON public.cart_items FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Users add to own cart" ON public.cart_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cart" ON public.cart_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cart" ON public.cart_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============ TRIGGER: notify everyone when a new listing is posted ============
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT p.id,
         'New ' || NEW.category || ' listing',
         NEW.title || ' — KSh ' || NEW.price,
         'new_listing',
         '/' || NEW.category
  FROM public.profiles p
  WHERE p.id <> NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_listing_notify
AFTER INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_new_listing();

INSERT INTO storage.buckets (id, name, public) VALUES ('music', 'music', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Music public read" ON storage.objects FOR SELECT USING (bucket_id = 'music');
CREATE POLICY "Admins upload music" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'music' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update music" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'music' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete music" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'music' AND has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient uuid; sender_name text;
BEGIN
  SELECT CASE WHEN c.user_a = NEW.sender_id THEN c.user_b ELSE c.user_a END INTO recipient
  FROM conversations c WHERE c.id = NEW.conversation_id;
  IF recipient IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, 'Someone') INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  INSERT INTO notifications (user_id, title, body, type, link)
  VALUES (recipient, '💬 ' || sender_name, LEFT(NEW.content, 120), 'message', '/chat?c=' || NEW.conversation_id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
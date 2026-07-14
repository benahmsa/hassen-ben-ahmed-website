DROP POLICY IF EXISTS "Anyone can send a message" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon;
REVOKE INSERT ON public.contact_messages FROM authenticated;
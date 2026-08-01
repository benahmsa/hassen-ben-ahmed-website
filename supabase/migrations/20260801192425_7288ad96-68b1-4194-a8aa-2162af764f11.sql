DROP POLICY IF EXISTS "Anyone can read site content" ON public.site_content;

CREATE POLICY "Public can read non-sensitive site content"
ON public.site_content
FOR SELECT
TO anon
USING (key <> 'contact_recipient_email');

CREATE POLICY "Admins can read all site content"
ON public.site_content
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
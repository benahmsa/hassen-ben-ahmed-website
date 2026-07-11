-- Restrict SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;

-- Rework public read policies so anon never calls has_role
DROP POLICY "Anyone can read published posts" ON public.posts;
CREATE POLICY "Anyone can read published posts" ON public.posts
FOR SELECT USING (published = true);

DROP POLICY "Anyone can read published news" ON public.news_items;
CREATE POLICY "Anyone can read published news" ON public.news_items
FOR SELECT USING (published = true);

DROP POLICY "Anyone can read published media" ON public.media_items;
CREATE POLICY "Anyone can read published media" ON public.media_items
FOR SELECT USING (published = true);
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Bootstrap: first authenticated user can become admin if no admin exists
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;

-- Blog posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ar text NOT NULL DEFAULT '',
  title_fr text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  excerpt_ar text NOT NULL DEFAULT '',
  excerpt_fr text NOT NULL DEFAULT '',
  excerpt_en text NOT NULL DEFAULT '',
  content_ar text NOT NULL DEFAULT '',
  content_fr text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  cover_url text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts" ON public.posts
FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage posts" ON public.posts
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- News
CREATE TABLE public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL DEFAULT '',
  title_fr text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  content_ar text NOT NULL DEFAULT '',
  content_fr text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_items TO authenticated;
GRANT ALL ON public.news_items TO service_role;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published news" ON public.news_items
FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage news" ON public.news_items
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Media (archives)
CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text NOT NULL DEFAULT 'photo',
  url text NOT NULL,
  thumbnail_url text,
  caption_ar text NOT NULL DEFAULT '',
  caption_fr text NOT NULL DEFAULT '',
  caption_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_items TO authenticated;
GRANT ALL ON public.media_items TO service_role;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published media" ON public.media_items
FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage media" ON public.media_items
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Editable site content (biography etc.)
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  content_ar text NOT NULL DEFAULT '',
  content_fr text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins manage site content" ON public.site_content
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Contact messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a message" ON public.contact_messages
FOR INSERT WITH CHECK (char_length(name) BETWEEN 1 AND 100 AND char_length(email) BETWEEN 3 AND 255 AND char_length(message) BETWEEN 1 AND 5000 AND char_length(subject) <= 200);
CREATE POLICY "Admins read messages" ON public.contact_messages
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update messages" ON public.contact_messages
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete messages" ON public.contact_messages
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed biography
INSERT INTO public.site_content (key, content_ar, content_fr, content_en) VALUES (
'biography',
'حسن بن أحمد، 66 سنة، عملت بالصحافة المكتوبة من 1979 إلى 1982 كمتعاون (pigiste) قارّ في الرياضة في عدة اختصاصات: الملاكمة والرقبي وكرة السلة، ثم توجهت إلى كرة القدم كمحلل في جريدة «البيان» الأسبوعية الأكثر انتشاراً.

في سنة 1982 قرر السيد فرجاني بلحاج عمار رحمه الله ترسيمي كمسؤول على صفحتين أسبوعيتين تعتنيان بالفنون والثقافة، وتواصل عملي إلى 2013. وبالتوازي كنت أكتب وأحلل البطولة الوطنية لكرة القدم، وغطيت جلّ رحلات ومباريات الترجي والمنتخب، إلى جانب كؤوس إفريقيا والعالم، كما غطيت أحداثاً كبرى في كرة السلة والملاكمة.

أما بالنسبة للصفحات الفنية فقد أجريت حوارات نادرة مع الموسيقار محمد عبد الوهاب والموجي وبليغ حمدي ووردة وميادة وسهير البابلي وأمينة رزق وفريد شوقي وكريمة مختار وفؤاد المهندس وعديد النجوم. كما ساعدت عديد المطربين التونسيين في بداياتهم أمثال صابر وصوفية وأمينة ونوال وغيرهم، وكنت من مؤسسي مهرجان الأغنية سنة 1986، وكذلك أدرت مهرجان البحر الأبيض المتوسط بحلق الوادي وبرمجت عديد الفنانين مثل كاظم الساهر وصباح فخري وغيرهما.

كما اشتغلت في قناة حنبعل في برنامج ذائع الصيت بعنوان «بلا مجاملة» طيلة 4 سنوات، وبعده انتقلت إلى منوعة تلفزية كل أحد طيلة 3 سنوات عرفت نجاحاً كبيراً، ولكنها توقفت لانعدام الإمكانيات المادية للقناة التي غادرها جلّ الزملاء للأسف. وأنا الآن بصدد التفكير في مشاريع فنية أو رياضية.

هذا باختزال كبير لحياتي الصحفية والإعلامية، إلى جانب اختياري في عديد اللجان لمهرجان الأغنية، بالإضافة إلى إصدار كتاب عن المنشط الممتاز الراحل نجيب الخطاب في أفريل 1999 بعد سنة من وفاته، وقد تعطل في المطبعة طيلة أشهر.',
'Hassen Ben Ahmed, 66 ans, a débuté dans la presse écrite de 1979 à 1982 comme pigiste régulier en sport, couvrant plusieurs disciplines : boxe, rugby et basket-ball, avant de se tourner vers le football comme analyste au journal hebdomadaire « Al Bayane », le plus diffusé de l''époque.

En 1982, M. Ferjani Belhaj Ammar (paix à son âme) décide de le titulariser comme responsable de deux pages hebdomadaires consacrées aux arts et à la culture - une mission qu''il poursuivra jusqu''en 2013. En parallèle, il écrit et analyse le championnat national de football, couvre la plupart des déplacements et matchs de l''Espérance de Tunis et de l''équipe nationale, ainsi que les Coupes d''Afrique et du Monde, sans oublier de grands événements de basket-ball et de boxe.

Dans les pages artistiques, il réalise des entretiens rares avec le musicien Mohamed Abdel Wahab, Al Mougy, Baligh Hamdi, Warda, Mayada, Soheir El Babli, Amina Rizk, Farid Chawki, Karima Mokhtar, Fouad El Mohandes et de nombreuses autres stars. Il accompagne également plusieurs chanteurs tunisiens à leurs débuts, tels que Saber, Soufia, Amina, Nawal et d''autres. Il est l''un des fondateurs du Festival de la Chanson en 1986 et a dirigé le Festival de la Méditerranée à La Goulette, programmant de nombreux artistes comme Kadhem Saher et Sabah Fakhri.

Il a travaillé à la chaîne Hannibal TV dans la célèbre émission « Bila Moujamala » (Sans complaisance) pendant 4 ans, puis animé une émission de variétés télévisée chaque dimanche durant 3 ans, avec un grand succès, avant son arrêt faute de moyens financiers de la chaîne, quittée hélas par la plupart des collègues. Il réfléchit aujourd''hui à de nouveaux projets artistiques ou sportifs.

Ceci n''est qu''un résumé très condensé de sa vie journalistique et médiatique, à laquelle s''ajoutent sa participation à de nombreux jurys du Festival de la Chanson et la publication, en avril 1999, d''un livre consacré au remarquable animateur regretté Najib El Khattab, un an après sa disparition.',
'Hassen Ben Ahmed, 66, began his career in print journalism from 1979 to 1982 as a regular freelance sports writer, covering several disciplines: boxing, rugby and basketball, before turning to football as an analyst for the weekly newspaper "Al Bayane", the most widely circulated of its time.

In 1982, Mr. Ferjani Belhaj Ammar (may he rest in peace) made him permanent editor of two weekly pages devoted to arts and culture - a role he held until 2013. In parallel, he wrote about and analysed the national football championship, covered most of the travels and matches of Espérance de Tunis and the national team, as well as the Africa Cup of Nations and World Cups, along with major basketball and boxing events.

For the arts pages, he conducted rare interviews with composer Mohamed Abdel Wahab, Al Mougy, Baligh Hamdi, Warda, Mayada, Soheir El Babli, Amina Rizk, Farid Shawqi, Karima Mokhtar, Fouad El Mohandes and many other stars. He also supported several Tunisian singers at the start of their careers, such as Saber, Soufia, Amina and Nawal. He was one of the founders of the Song Festival in 1986 and directed the Mediterranean Festival in La Goulette, programming many artists including Kadhem Saher and Sabah Fakhri.

He worked at Hannibal TV on the famous programme "Bila Mujamala" (No Flattery) for 4 years, then hosted a Sunday TV variety show for 3 years with great success, before it stopped due to the channel''s lack of financial means. He is now considering new artistic or sports projects.

This is only a brief summary of his journalistic and media career, alongside his participation in numerous Song Festival juries and the publication, in April 1999, of a book about the outstanding late host Najib El Khattab, one year after his passing.'
);
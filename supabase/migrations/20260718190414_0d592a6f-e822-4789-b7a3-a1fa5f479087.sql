INSERT INTO public.site_content (key, content_ar, content_fr, content_en)
VALUES ('contact_recipient_email', 'medsaid.benahmed@gmail.com', 'medsaid.benahmed@gmail.com', 'medsaid.benahmed@gmail.com')
ON CONFLICT (key) DO NOTHING;
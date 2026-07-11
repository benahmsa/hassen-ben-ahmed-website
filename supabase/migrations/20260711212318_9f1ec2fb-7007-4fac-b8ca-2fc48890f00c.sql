ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS published_at timestamptz;

UPDATE public.interviews SET published_at = v.d FROM (VALUES
 ('Q01GPMsaPGU','2021-03-01T12:41:08Z'::timestamptz),
 ('DMP-gJY-TfI','2024-02-02T11:30:07Z'::timestamptz),
 ('o6q1oN5IVkk','2022-02-03T17:21:38Z'::timestamptz),
 ('BFHMq5bmuW4','2025-07-07T23:03:48Z'::timestamptz),
 ('FOWYosNNtqE','2022-02-03T20:45:54Z'::timestamptz),
 ('H2p9YoJPx2A','2024-11-04T12:36:37Z'::timestamptz),
 ('Xlan0U07nOI','2011-12-15T21:41:00Z'::timestamptz),
 ('Ol0uSLbeSS8','2014-09-22T14:14:56Z'::timestamptz),
 ('nUMrRWxrBIg','2023-12-30T16:50:33Z'::timestamptz),
 ('XjQLQ9ZwsLk','2023-12-30T15:56:23Z'::timestamptz),
 ('MYHJ2WC-WJY','2023-12-30T16:20:45Z'::timestamptz),
 ('qcphSVfxUI0','2022-01-25T18:43:05Z'::timestamptz),
 ('tdLOWs2pmUQ','2023-12-30T16:12:44Z'::timestamptz),
 ('4-8zlC1jeXI','2023-10-21T15:36:22Z'::timestamptz)
) AS v(yid,d) WHERE interviews.youtube_id = v.yid;
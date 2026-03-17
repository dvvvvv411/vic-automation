ALTER TABLE public.brandings
ADD COLUMN chat_online_from time NOT NULL DEFAULT '08:00',
ADD COLUMN chat_online_until time NOT NULL DEFAULT '17:00';
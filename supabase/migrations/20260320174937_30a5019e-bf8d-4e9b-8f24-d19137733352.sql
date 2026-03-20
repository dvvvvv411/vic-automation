UPDATE public.telegram_chats
SET events = array_append(events, 'probetag_gebucht')
WHERE 'gespraech_gebucht' = ANY(events)
  AND NOT ('probetag_gebucht' = ANY(events));
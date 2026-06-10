-- 1. Email queue table
CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  sent_at timestamptz,
  -- payload
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body_title text NOT NULL,
  body_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  button_text text,
  button_url text,
  footer_lines jsonb,
  branding_id uuid,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT email_queue_status_check CHECK (status IN ('pending','sending','sent','failed'))
);

CREATE INDEX idx_email_queue_pending ON public.email_queue (next_attempt_at) WHERE status = 'pending';
CREATE INDEX idx_email_queue_status ON public.email_queue (status, created_at DESC);

GRANT ALL ON public.email_queue TO service_role;

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Admins können die Queue im Dashboard einsehen
CREATE POLICY "Admins can view email queue"
ON public.email_queue
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.email_queue_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER email_queue_updated_at
BEFORE UPDATE ON public.email_queue
FOR EACH ROW EXECUTE FUNCTION public.email_queue_set_updated_at();

-- 2. enqueue_email: berechnet next_attempt_at = max(now(), letzter geplanter Slot) + random(15..60s)
CREATE OR REPLACE FUNCTION public.enqueue_email(
  _to text,
  _recipient_name text,
  _subject text,
  _body_title text,
  _body_lines jsonb,
  _button_text text,
  _button_url text,
  _footer_lines jsonb,
  _branding_id uuid,
  _event_type text,
  _metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_slot timestamptz;
  next_slot timestamptz;
  new_id uuid;
  delay_seconds int;
BEGIN
  -- Lock-free: höchster geplanter Sendezeitpunkt aller noch ausstehenden Mails
  SELECT MAX(next_attempt_at) INTO last_slot
  FROM public.email_queue
  WHERE status IN ('pending','sending');

  -- Zufälliger Abstand 15-60 Sekunden
  delay_seconds := 15 + floor(random() * 46)::int;

  next_slot := GREATEST(COALESCE(last_slot, now()), now()) + (delay_seconds || ' seconds')::interval;

  INSERT INTO public.email_queue (
    recipient_email, recipient_name, subject, body_title, body_lines,
    button_text, button_url, footer_lines, branding_id, event_type, metadata,
    status, next_attempt_at
  ) VALUES (
    _to, _recipient_name, _subject, _body_title, COALESCE(_body_lines, '[]'::jsonb),
    _button_text, _button_url, _footer_lines, _branding_id, _event_type, COALESCE(_metadata, '{}'::jsonb),
    'pending', next_slot
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text,text,text,text,jsonb,text,text,jsonb,uuid,text,jsonb) TO service_role;

-- 3. claim_email_batch: holt fällige Mails atomar (SKIP LOCKED), setzt status='sending'
CREATE OR REPLACE FUNCTION public.claim_email_batch(_limit int DEFAULT 5)
RETURNS SETOF public.email_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT id FROM public.email_queue
    WHERE status = 'pending' AND next_attempt_at <= now()
    ORDER BY next_attempt_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT _limit
  )
  UPDATE public.email_queue eq
  SET status = 'sending', attempts = eq.attempts + 1
  FROM picked
  WHERE eq.id = picked.id
  RETURNING eq.*;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_email_batch(int) TO service_role;

-- 4. pg_cron + pg_net for processor
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
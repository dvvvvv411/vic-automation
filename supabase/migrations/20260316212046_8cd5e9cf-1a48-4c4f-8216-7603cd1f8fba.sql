SELECT cron.schedule(
  'appointment-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://luorlnagxpsibarcygjm.supabase.co/functions/v1/send-appointment-reminders',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b3JsbmFneHBzaWJhcmN5Z2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI3MTAsImV4cCI6MjA4NjM3ODcxMH0.B0MYZqUChRbyW3ekOR8YI4j7q153ME77qI_LjUUJTqs"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
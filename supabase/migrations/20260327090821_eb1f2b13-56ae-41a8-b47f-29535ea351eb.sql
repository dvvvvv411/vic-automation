CREATE POLICY "Admin and kunde can update sms_logs"
ON public.sms_logs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_kunde(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_kunde(auth.uid())
);
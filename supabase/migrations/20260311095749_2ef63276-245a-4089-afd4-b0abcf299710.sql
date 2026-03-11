-- Mitarbeiter können eigenen Vertrag lesen
CREATE POLICY "Users can select own employment_contract"
ON public.employment_contracts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Mitarbeiter können eigenen Vertrag aktualisieren (für Unterschrift etc.)
CREATE POLICY "Users can update own employment_contract"
ON public.employment_contracts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
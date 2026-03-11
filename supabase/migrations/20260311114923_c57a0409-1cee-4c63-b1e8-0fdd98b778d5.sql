
DROP POLICY "Kunden can select own order_reviews" ON order_reviews;

CREATE POLICY "Kunden can select own order_reviews"
  ON order_reviews FOR SELECT TO authenticated
  USING (
    is_kunde(auth.uid()) 
    AND contract_id IN (
      SELECT id FROM employment_contracts WHERE created_by = auth.uid()
    )
  );

DROP POLICY "Admins can delete order_reviews" ON order_reviews;

CREATE POLICY "Admins and Kunden can delete order_reviews"
  ON order_reviews FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL))
    OR (is_kunde(auth.uid()) AND contract_id IN (
      SELECT id FROM employment_contracts WHERE created_by = auth.uid()
    ))
  );

UPDATE order_assignments
SET status = 'erfolgreich'
WHERE contract_id = '892e6fda-0dbb-4ed5-a7b3-0b8b5315c2f8'
  AND order_id IN (
    'a4445b57-979a-4272-bf51-5affdf430f89',
    'c47dcf68-4220-41fe-95ea-8e38e597d85b'
  )
  AND status = 'offen';
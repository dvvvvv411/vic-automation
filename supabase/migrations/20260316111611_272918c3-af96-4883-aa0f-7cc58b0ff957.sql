UPDATE order_assignments
SET status = 'in_pruefung'
WHERE order_id = 'c28d539d-8463-4c23-b329-dba1d9d64f58'
  AND contract_id = '9f392f86-c779-426b-82bb-a6fc15abfdfe'
  AND status = 'erfolgreich';
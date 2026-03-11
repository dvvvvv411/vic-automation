-- Fix existing order_assignments: derive created_by from employment_contracts
UPDATE order_assignments oa
SET created_by = ec.created_by
FROM employment_contracts ec
WHERE oa.contract_id = ec.id
  AND oa.created_by IS NULL
  AND ec.created_by IS NOT NULL;
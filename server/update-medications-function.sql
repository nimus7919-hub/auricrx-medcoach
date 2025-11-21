-- Update get_user_medications function to filter by is_active
-- Run this in your Neon SQL Editor to update the function

CREATE OR REPLACE FUNCTION get_user_medications(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  medication_name TEXT,
  strength_value TEXT,
  strength_unit TEXT,
  status TEXT,
  times TEXT[],
  start_date DATE,
  end_date DATE,
  notes TEXT,
  doses_left TEXT,
  quantity_value TEXT,
  quantity_unit TEXT,
  last_refill DATE,
  is_active BOOLEAN
) AS $$
BEGIN
  PERFORM set_user_context(p_user_id);
  
  RETURN QUERY
  SELECT 
    um.id,
    um.created_at,
    um.medication_name,
    um.strength_value,
    um.strength_unit,
    um.status,
    um.times,
    um.start_date,
    um.end_date,
    um.notes,
    um.doses_left,
    um.quantity_value,
    um.quantity_unit,
    um.last_refill,
    um.is_active
  FROM user_medications um
  WHERE um.user_id = p_user_id AND um.is_active = true
  ORDER BY um.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


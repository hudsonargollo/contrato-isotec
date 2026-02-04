-- Test script for database migrations
-- Run this after applying migrations to verify everything works correctly

-- Test 1: Verify all tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('profiles', 'contracts', 'contract_items', 'audit_logs')) = 4,
         'Not all tables were created';
  RAISE NOTICE 'Test 1 PASSED: All tables exist';
END $$;

-- Test 2: Verify RLS is enabled on all tables
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('profiles', 'contracts', 'contract_items', 'audit_logs')
          AND rowsecurity = true) = 4,
         'RLS is not enabled on all tables';
  RAISE NOTICE 'Test 2 PASSED: RLS enabled on all tables';
END $$;

-- Test 3: Verify indexes exist
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'contracts', 'contract_items', 'audit_logs');
  
  ASSERT index_count >= 15, 'Expected at least 15 indexes, found ' || index_count;
  RAISE NOTICE 'Test 3 PASSED: % indexes created', index_count;
END $$;

-- Test 4: Test Brazilian coordinate validation
DO $$
BEGIN
  -- Test valid coordinates (São Paulo)
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      location_latitude, location_longitude,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User', '12345678901', 'test@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      -23.5613, -46.6565,
      10.0, '[]'::jsonb, 50000.00, 'pix'
    );
    RAISE NOTICE 'Test 4a PASSED: Valid Brazilian coordinates accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'Test 4a FAILED: Valid coordinates rejected';
  END;
  
  -- Test invalid coordinates (outside Brazil)
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      location_latitude, location_longitude,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User 2', '12345678902', 'test2@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      40.7128, -74.0060, -- New York coordinates
      10.0, '[]'::jsonb, 50000.00, 'pix'
    );
    RAISE EXCEPTION 'Test 4b FAILED: Invalid coordinates accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test 4b PASSED: Invalid coordinates rejected';
  END;
  
  -- Cleanup
  DELETE FROM public.contracts WHERE contractor_cpf IN ('12345678901', '12345678902');
END $$;

-- Test 5: Test CPF format validation
DO $$
BEGIN
  -- Test valid CPF format
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User', '12345678901', 'test@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      10.0, '[]'::jsonb, 50000.00, 'pix'
    );
    RAISE NOTICE 'Test 5a PASSED: Valid CPF format accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'Test 5a FAILED: Valid CPF format rejected';
  END;
  
  -- Test invalid CPF format (with formatting)
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User 2', '123.456.789-01', 'test2@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      10.0, '[]'::jsonb, 50000.00, 'pix'
    );
    RAISE EXCEPTION 'Test 5b FAILED: Invalid CPF format accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test 5b PASSED: Invalid CPF format rejected';
  END;
  
  -- Cleanup
  DELETE FROM public.contracts WHERE contractor_cpf = '12345678901';
END $$;

-- Test 6: Test services JSONB validation
DO $$
BEGIN
  -- Test valid services structure
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User', '12345678901', 'test@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      10.0, '[{"description": "Test Service", "included": true}]'::jsonb, 50000.00, 'pix'
    );
    RAISE NOTICE 'Test 6a PASSED: Valid services structure accepted';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Test 6a FAILED: Valid services structure rejected - %', SQLERRM;
  END;
  
  -- Test invalid services structure (missing fields)
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User 2', '12345678902', 'test2@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      10.0, '[{"description": "Test Service"}]'::jsonb, 50000.00, 'pix'
    );
    RAISE EXCEPTION 'Test 6b FAILED: Invalid services structure accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%must have description%' OR SQLERRM LIKE '%included%' THEN
      RAISE NOTICE 'Test 6b PASSED: Invalid services structure rejected';
    ELSE
      RAISE EXCEPTION 'Test 6b FAILED: Wrong error - %', SQLERRM;
    END IF;
  END;
  
  -- Cleanup
  DELETE FROM public.contracts WHERE contractor_cpf IN ('12345678901', '12345678902');
END $$;

-- Test 7: Test audit log immutability
DO $$
DECLARE
  test_contract_id UUID;
  test_log_id UUID;
BEGIN
  -- Create a test contract
  INSERT INTO public.contracts (
    contractor_name, contractor_cpf, contractor_email,
    address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
    project_kwp, services, contract_value, payment_method
  ) VALUES (
    'Test User', '12345678901', 'test@example.com',
    '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
    10.0, '[]'::jsonb, 50000.00, 'pix'
  ) RETURNING id INTO test_contract_id;
  
  -- Get the auto-created audit log
  SELECT id INTO test_log_id FROM public.audit_logs WHERE contract_id = test_contract_id LIMIT 1;
  
  -- Try to update audit log (should fail)
  BEGIN
    UPDATE public.audit_logs SET event_type = 'signature_completed' WHERE id = test_log_id;
    RAISE EXCEPTION 'Test 7a FAILED: Audit log update was allowed';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%immutable%' THEN
      RAISE NOTICE 'Test 7a PASSED: Audit log update prevented';
    ELSE
      RAISE EXCEPTION 'Test 7a FAILED: Wrong error - %', SQLERRM;
    END IF;
  END;
  
  -- Try to delete audit log (should fail)
  BEGIN
    DELETE FROM public.audit_logs WHERE id = test_log_id;
    RAISE EXCEPTION 'Test 7b FAILED: Audit log delete was allowed';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%immutable%' THEN
      RAISE NOTICE 'Test 7b PASSED: Audit log delete prevented';
    ELSE
      RAISE EXCEPTION 'Test 7b FAILED: Wrong error - %', SQLERRM;
    END IF;
  END;
  
  -- Cleanup
  DELETE FROM public.contracts WHERE id = test_contract_id;
END $$;

-- Test 8: Test contract_items cascade delete
DO $$
DECLARE
  test_contract_id UUID;
  items_count INTEGER;
BEGIN
  -- Create a test contract
  INSERT INTO public.contracts (
    contractor_name, contractor_cpf, contractor_email,
    address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
    project_kwp, services, contract_value, payment_method
  ) VALUES (
    'Test User', '12345678901', 'test@example.com',
    '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
    10.0, '[]'::jsonb, 50000.00, 'pix'
  ) RETURNING id INTO test_contract_id;
  
  -- Add contract items
  INSERT INTO public.contract_items (contract_id, item_name, quantity, unit) VALUES
    (test_contract_id, 'Test Item 1', 10, 'un'),
    (test_contract_id, 'Test Item 2', 5, 'kg');
  
  -- Verify items were created
  SELECT COUNT(*) INTO items_count FROM public.contract_items WHERE contract_id = test_contract_id;
  ASSERT items_count = 2, 'Items were not created';
  
  -- Delete contract
  DELETE FROM public.contracts WHERE id = test_contract_id;
  
  -- Verify items were cascade deleted
  SELECT COUNT(*) INTO items_count FROM public.contract_items WHERE contract_id = test_contract_id;
  ASSERT items_count = 0, 'Items were not cascade deleted';
  
  RAISE NOTICE 'Test 8 PASSED: Cascade delete works correctly';
END $$;

-- Test 9: Test positive value constraints
DO $$
BEGIN
  -- Test negative contract value (should fail)
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User', '12345678901', 'test@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      10.0, '[]'::jsonb, -50000.00, 'pix'
    );
    RAISE EXCEPTION 'Test 9a FAILED: Negative contract value accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test 9a PASSED: Negative contract value rejected';
  END;
  
  -- Test negative kWp (should fail)
  BEGIN
    INSERT INTO public.contracts (
      contractor_name, contractor_cpf, contractor_email,
      address_cep, address_street, address_number, address_neighborhood, address_city, address_state,
      project_kwp, services, contract_value, payment_method
    ) VALUES (
      'Test User', '12345678901', 'test@example.com',
      '01310100', 'Test Street', '123', 'Test Neighborhood', 'São Paulo', 'SP',
      -10.0, '[]'::jsonb, 50000.00, 'pix'
    );
    RAISE EXCEPTION 'Test 9b FAILED: Negative kWp accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test 9b PASSED: Negative kWp rejected';
  END;
END $$;

-- Summary
RAISE NOTICE '========================================';
RAISE NOTICE 'All migration tests completed successfully!';
RAISE NOTICE '========================================';

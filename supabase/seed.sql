-- Seed file for initial development data
-- This file is used to populate the database with test data for local development

-- Note: In production, the first admin user should be created through the Supabase dashboard
-- or via a secure onboarding process

-- Example: Create a test admin user profile (only for local development)
-- Uncomment and modify the following lines after creating a user in Supabase Auth:

/*
-- Insert test admin profile (replace with actual user ID from auth.users)
INSERT INTO public.profiles (id, email, full_name, role, mfa_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- Replace with actual user ID
  'admin@isotec.com.br',
  'Test Admin',
  'super_admin',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Insert test contract
INSERT INTO public.contracts (
  contractor_name,
  contractor_cpf,
  contractor_email,
  contractor_phone,
  address_cep,
  address_street,
  address_number,
  address_neighborhood,
  address_city,
  address_state,
  location_latitude,
  location_longitude,
  project_kwp,
  installation_date,
  services,
  contract_value,
  payment_method,
  status,
  created_by
) VALUES (
  'João da Silva',
  '12345678901',
  'joao.silva@example.com',
  '11987654321',
  '01310100',
  'Avenida Paulista',
  '1578',
  NULL,
  'Bela Vista',
  'São Paulo',
  'SP',
  -23.5613,
  -46.6565,
  10.50,
  '2024-06-15',
  '[
    {"description": "Instalação de painéis solares", "included": true},
    {"description": "Instalação de inversor", "included": true},
    {"description": "Instalação de estrutura de fixação", "included": true},
    {"description": "Conexão à rede elétrica", "included": true},
    {"description": "Homologação junto à concessionária", "included": true},
    {"description": "Monitoramento remoto", "included": true}
  ]'::jsonb,
  85000.00,
  'pix',
  'pending_signature',
  '00000000-0000-0000-0000-000000000000'::uuid -- Replace with actual admin user ID
);

-- Get the contract ID for inserting items
DO $$
DECLARE
  contract_uuid UUID;
BEGIN
  SELECT id INTO contract_uuid FROM public.contracts WHERE contractor_cpf = '12345678901' LIMIT 1;
  
  -- Insert contract items
  INSERT INTO public.contract_items (contract_id, item_name, quantity, unit, sort_order) VALUES
    (contract_uuid, 'Painel Solar 550W Monocristalino', 20, 'un', 1),
    (contract_uuid, 'Inversor Solar 10kW', 1, 'un', 2),
    (contract_uuid, 'Estrutura de Fixação em Alumínio', 1, 'un', 3),
    (contract_uuid, 'Cabo Solar 6mm²', 100, 'm', 4),
    (contract_uuid, 'String Box 2 Entradas', 1, 'un', 5),
    (contract_uuid, 'Disjuntor CC 32A', 2, 'un', 6);
END $$;
*/

-- Add more seed data as needed for testing

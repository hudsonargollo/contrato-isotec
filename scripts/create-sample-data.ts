#!/usr/bin/env tsx

/**
 * Create sample data for testing the dashboard
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleData() {
  console.log('🏗️  Creating sample data for dashboard testing...\n');
  
  try {
    // Check if contracts table exists
    console.log('1️⃣ Checking contracts table...');
    const { data: existingContracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .limit(1);
    
    if (contractsError) {
      console.log('❌ Contracts table not accessible:', contractsError.message);
      console.log('   The contracts table may not exist yet.');
      console.log('   This is normal if you haven\'t created any contracts through the wizard.');
      return;
    }
    
    console.log('✅ Contracts table exists');
    
    // Create sample contracts
    console.log('\n2️⃣ Creating sample contracts...');
    
    const sampleContracts = [
      {
        uuid: crypto.randomUUID(),
        contractor_name: 'João Silva',
        contractor_cpf: '12345678901',
        contractor_email: 'joao@example.com',
        contractor_phone: '(11) 99999-1111',
        address_cep: '01310100',
        address_street: 'Avenida Paulista',
        address_number: '1000',
        address_complement: 'Apto 101',
        address_neighborhood: 'Bela Vista',
        address_city: 'São Paulo',
        address_state: 'SP',
        location_latitude: -23.5505199,
        location_longitude: -46.6333094,
        project_kwp: 5.5,
        installation_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        services: [
          { description: 'Instalação de sistema fotovoltaico', included: true },
          { description: 'Projeto elétrico', included: true },
          { description: 'Homologação junto à concessionária', included: true }
        ],
        contract_value: 25000,
        payment_method: 'pix',
        status: 'signed',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        signed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
      {
        uuid: crypto.randomUUID(),
        contractor_name: 'Maria Santos',
        contractor_cpf: '98765432109',
        contractor_email: 'maria@example.com',
        contractor_phone: '(11) 99999-2222',
        address_cep: '04038001',
        address_street: 'Rua Vergueiro',
        address_number: '2000',
        address_complement: '',
        address_neighborhood: 'Vila Mariana',
        address_city: 'São Paulo',
        address_state: 'SP',
        location_latitude: -23.5880684,
        location_longitude: -46.6414213,
        project_kwp: 7.2,
        installation_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now
        services: [
          { description: 'Instalação de sistema fotovoltaico', included: true },
          { description: 'Projeto elétrico', included: true },
          { description: 'Monitoramento remoto', included: false }
        ],
        contract_value: 30000,
        payment_method: 'credit',
        status: 'pending_signature',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        uuid: crypto.randomUUID(),
        contractor_name: 'Pedro Oliveira',
        contractor_cpf: '45678912345',
        contractor_email: 'pedro@example.com',
        contractor_phone: '(11) 99999-3333',
        address_cep: '05407002',
        address_street: 'Rua Teodoro Sampaio',
        address_number: '1500',
        address_complement: 'Casa',
        address_neighborhood: 'Pinheiros',
        address_city: 'São Paulo',
        address_state: 'SP',
        location_latitude: -23.5629068,
        location_longitude: -46.6918595,
        project_kwp: 8.8,
        installation_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
        services: [
          { description: 'Instalação de sistema fotovoltaico', included: true },
          { description: 'Projeto elétrico', included: true },
          { description: 'Homologação junto à concessionária', included: true },
          { description: 'Monitoramento remoto', included: true }
        ],
        contract_value: 35000,
        payment_method: 'pix',
        status: 'signed',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        signed_at: new Date().toISOString(), // Today
      },
      {
        uuid: crypto.randomUUID(),
        contractor_name: 'Ana Costa',
        contractor_cpf: '78912345678',
        contractor_email: 'ana@example.com',
        contractor_phone: '(11) 99999-4444',
        address_cep: '01452000',
        address_street: 'Rua Augusta',
        address_number: '800',
        address_complement: 'Sala 10',
        address_neighborhood: 'Consolação',
        address_city: 'São Paulo',
        address_state: 'SP',
        location_latitude: -23.5505199,
        location_longitude: -46.6333094,
        project_kwp: 6.0,
        installation_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days from now
        services: [
          { description: 'Instalação de sistema fotovoltaico', included: true },
          { description: 'Projeto elétrico', included: true }
        ],
        contract_value: 28000,
        payment_method: 'cash',
        status: 'pending_signature',
        created_at: new Date().toISOString(), // Today
      }
    ];
    
    for (const contract of sampleContracts) {
      const { error: insertError } = await supabaseAdmin
        .from('contracts')
        .insert(contract);
      
      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          console.log(`⚠️  Contract ${contract.contractor_name} already exists`);
        } else {
          console.log(`❌ Failed to create contract for ${contract.contractor_name}:`, insertError.message);
        }
      } else {
        console.log(`✅ Created contract for ${contract.contractor_name}`);
      }
    }
    
    // Check final counts
    console.log('\n3️⃣ Checking final statistics...');
    
    const [totalResult, signedResult, pendingResult] = await Promise.all([
      supabaseAdmin.from('contracts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'signed'),
      supabaseAdmin.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'pending_signature')
    ]);
    
    console.log(`📊 Total contracts: ${totalResult.count || 0}`);
    console.log(`✅ Signed contracts: ${signedResult.count || 0}`);
    console.log(`⏳ Pending contracts: ${pendingResult.count || 0}`);
    
    console.log('\n🎉 Sample data creation complete!');
    console.log('   You can now test the dashboard with real data.');
    
  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
  }
}

async function cleanupSampleData() {
  console.log('🧹 Cleaning up sample data...\n');
  
  try {
    const { error } = await supabaseAdmin
      .from('contracts')
      .delete()
      .in('contractor_name', ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa']);
    
    if (error) {
      console.log('❌ Cleanup failed:', error.message);
    } else {
      console.log('✅ Sample data cleaned up');
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Sample Data Creator\n');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    await cleanupSampleData();
  } else {
    await createSampleData();
    console.log('\n💡 To clean up sample data later, run:');
    console.log('   npx tsx scripts/create-sample-data.ts --cleanup');
  }
}

main().catch(console.error);
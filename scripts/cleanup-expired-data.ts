/**
 * Data Cleanup Script
 * 
 * Removes expired data according to retention policies.
 * Should be run periodically (e.g., daily via cron job).
 * 
 * Requirements: 11.6
 */

import { createClient } from '@supabase/supabase-js';
import { DATA_RETENTION_POLICY, calculateDeletionDate } from '../lib/config/data-retention';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CleanupResult {
  verificationCodes: number;
  unsignedContracts: number;
  errors: string[];
}

/**
 * Deletes expired verification codes
 */
async function cleanupVerificationCodes(): Promise<number> {
  const expirationDate = new Date();
  expirationDate.setMinutes(
    expirationDate.getMinutes() - DATA_RETENTION_POLICY.verificationCodes.retentionPeriodMinutes
  );

  const { data, error } = await supabase
    .from('verification_codes')
    .delete()
    .lt('expires_at', expirationDate.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to cleanup verification codes: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Deletes unsigned contracts older than retention period
 */
async function cleanupUnsignedContracts(): Promise<number> {
  const deletionDate = new Date();
  deletionDate.setFullYear(
    deletionDate.getFullYear() - DATA_RETENTION_POLICY.unsignedContracts.retentionPeriodYears
  );

  const { data, error } = await supabase
    .from('contracts')
    .delete()
    .eq('status', 'pending_signature')
    .lt('created_at', deletionDate.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to cleanup unsigned contracts: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Main cleanup function
 */
async function runCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    verificationCodes: 0,
    unsignedContracts: 0,
    errors: [],
  };

  console.log('Starting data cleanup...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Cleanup verification codes
  try {
    result.verificationCodes = await cleanupVerificationCodes();
    console.log(`✓ Deleted ${result.verificationCodes} expired verification codes`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(message);
    console.error(`✗ Error cleaning verification codes: ${message}`);
  }

  // Cleanup unsigned contracts
  try {
    result.unsignedContracts = await cleanupUnsignedContracts();
    console.log(`✓ Deleted ${result.unsignedContracts} old unsigned contracts`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(message);
    console.error(`✗ Error cleaning unsigned contracts: ${message}`);
  }

  console.log('\nCleanup completed');
  console.log(`Total items deleted: ${result.verificationCodes + result.unsignedContracts}`);
  console.log(`Errors: ${result.errors.length}`);

  return result;
}

// Run cleanup if executed directly
if (require.main === module) {
  runCleanup()
    .then((result) => {
      if (result.errors.length > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error during cleanup:', error);
      process.exit(1);
    });
}

export { runCleanup, cleanupVerificationCodes, cleanupUnsignedContracts };

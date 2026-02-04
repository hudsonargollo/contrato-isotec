# Contract Hashing Service - Usage Examples

This document provides examples of how to use the contract hashing service for ensuring contract integrity and legal compliance.

## Overview

The contract hashing service provides three main functions:

1. **`serializeContractForHashing(contract)`** - Converts contract data into a deterministic string
2. **`generateContractHash(contract)`** - Creates a SHA-256 hash of the contract content
3. **`verifyContractHash(contract, storedHash)`** - Verifies contract integrity by comparing hashes

## Basic Usage

### Generating a Contract Hash

When a contract is signed, generate a hash to store in the audit log:

```typescript
import { generateContractHash } from '@/lib/services/contract-hash';
import { Contract } from '@/lib/types';

// After a contract is signed
async function signContract(contract: Contract) {
  // Generate the hash
  const contractHash = generateContractHash(contract);
  
  // Store the hash in the audit log
  await createAuditLog({
    contractId: contract.id,
    eventType: 'signature_completed',
    signatureMethod: 'email',
    contractHash: contractHash,
    signerIdentifier: 'user@example.com',
    ipAddress: '192.168.1.1',
    createdAt: new Date(),
  });
  
  // Update contract status
  await updateContract(contract.id, {
    status: 'signed',
    contractHash: contractHash,
    signedAt: new Date(),
  });
}
```

### Verifying Contract Integrity

When retrieving a contract, verify it hasn't been tampered with:

```typescript
import { verifyContractHash } from '@/lib/services/contract-hash';

async function getContractWithVerification(contractId: string) {
  // Fetch the contract and its audit log
  const contract = await fetchContract(contractId);
  const auditLog = await fetchAuditLog(contractId);
  
  // Verify the contract hasn't been modified
  const isValid = verifyContractHash(contract, auditLog.contractHash);
  
  if (!isValid) {
    console.error('Contract integrity check failed! Contract may have been tampered with.');
    // Flag the contract for review
    await flagContractForReview(contractId, 'Hash verification failed');
  }
  
  return {
    contract,
    integrityVerified: isValid,
  };
}
```

### Displaying Verification Status

Show verification status in the UI:

```typescript
import { verifyContractHash } from '@/lib/services/contract-hash';

function ContractVerificationBadge({ contract, auditLog }) {
  const isValid = verifyContractHash(contract, auditLog.contractHash);
  
  return (
    <div className={`badge ${isValid ? 'badge-success' : 'badge-error'}`}>
      {isValid ? (
        <>
          <CheckIcon /> Contract Verified
        </>
      ) : (
        <>
          <AlertIcon /> Integrity Check Failed
        </>
      )}
    </div>
  );
}
```

## Advanced Usage

### Serialization for Debugging

View the serialized contract data for debugging:

```typescript
import { serializeContractForHashing } from '@/lib/services/contract-hash';

function debugContractSerialization(contract: Contract) {
  const serialized = serializeContractForHashing(contract);
  console.log('Serialized contract data:');
  console.log(serialized);
  
  // Split by separator to see individual fields
  const fields = serialized.split('|');
  fields.forEach((field, index) => {
    console.log(`Field ${index}: ${field}`);
  });
}
```

### Comparing Two Contract Versions

Detect what changed between two versions:

```typescript
import { generateContractHash, serializeContractForHashing } from '@/lib/services/contract-hash';

function compareContractVersions(oldContract: Contract, newContract: Contract) {
  const oldHash = generateContractHash(oldContract);
  const newHash = generateContractHash(newContract);
  
  if (oldHash === newHash) {
    console.log('Contracts are identical');
    return { changed: false };
  }
  
  // Contracts are different - show serialized versions for comparison
  const oldSerialized = serializeContractForHashing(oldContract);
  const newSerialized = serializeContractForHashing(newContract);
  
  console.log('Old contract:', oldSerialized);
  console.log('New contract:', newSerialized);
  
  return {
    changed: true,
    oldHash,
    newHash,
  };
}
```

### Batch Verification

Verify multiple contracts at once:

```typescript
import { verifyContractHash } from '@/lib/services/contract-hash';

async function verifyAllContracts() {
  const contracts = await fetchAllSignedContracts();
  const results = [];
  
  for (const contract of contracts) {
    const auditLog = await fetchAuditLog(contract.id);
    const isValid = verifyContractHash(contract, auditLog.contractHash);
    
    results.push({
      contractId: contract.id,
      contractorName: contract.contractorName,
      isValid,
    });
    
    if (!isValid) {
      console.error(`Contract ${contract.id} failed integrity check`);
    }
  }
  
  const failedCount = results.filter(r => !r.isValid).length;
  console.log(`Verified ${results.length} contracts. ${failedCount} failed.`);
  
  return results;
}
```

## Important Notes

### What Gets Hashed

The hash includes:
- ✅ Contractor information (name, CPF, email, phone)
- ✅ Installation address (all fields including coordinates)
- ✅ Project specifications (kWp, installation date)
- ✅ Equipment items (name, quantity, unit)
- ✅ Service scope (descriptions and included status)
- ✅ Financial information (value, payment method)

The hash **does NOT** include:
- ❌ Contract ID or UUID
- ❌ Status (pending_signature, signed, cancelled)
- ❌ Timestamps (createdAt, updatedAt, signedAt)
- ❌ Admin user ID (createdBy)
- ❌ The hash itself (contractHash)

### Determinism

The serialization is deterministic, meaning:
- Same contract content always produces the same hash
- Field order doesn't matter (fields are sorted alphabetically)
- Equipment items are sorted by sortOrder
- Services are sorted by description

### Sensitivity

The hash is sensitive to changes:
- Any change to any included field produces a different hash
- Even small changes (like a single character) produce completely different hashes
- This makes tampering detection very reliable

### Legal Compliance

This hashing implementation complies with:
- **MP 2.200-2/2001** - Brazilian digital signature law
- **Law 14.063/2020** - Electronic signature requirements
- **SHA-256** - Industry-standard cryptographic hash function

The hash serves as legal evidence that:
1. The contract content at signing time is preserved
2. Any modifications after signing can be detected
3. The integrity of the contract can be verified at any time

## Testing

Run the unit tests to verify the hashing functionality:

```bash
npm test -- tests/unit/services/contract-hash.test.ts
```

The tests verify:
- ✅ Deterministic serialization
- ✅ Hash generation (SHA-256, 64 hex characters)
- ✅ Hash sensitivity to changes
- ✅ Hash verification (round-trip)
- ✅ Edge cases (empty items, special characters, large values)

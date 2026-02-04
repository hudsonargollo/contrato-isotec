# Audit Log Service Examples

This document provides practical examples of using the Audit Log Service for creating and retrieving immutable audit log entries for contract signature events.

## Table of Contents

1. [Creating Audit Logs](#creating-audit-logs)
2. [Retrieving Audit Logs](#retrieving-audit-logs)
3. [Filtering Audit Logs](#filtering-audit-logs)
4. [Verifying Audit Log Hashes](#verifying-audit-log-hashes)
5. [Integration Examples](#integration-examples)

## Creating Audit Logs

### Example 1: Create Audit Log for GOV.BR Signature

```typescript
import { createAuditLog } from '@/lib/services/audit-log';
import { generateContractHash } from '@/lib/services/contract-hash';

// After successful GOV.BR OAuth authentication
async function recordGovBRSignature(
  contract: Contract,
  govbrUserId: string,
  ipAddress: string,
  userAgent: string
) {
  // Generate the contract hash
  const contractHash = generateContractHash(contract);
  
  // Create the audit log entry
  const auditLog = await createAuditLog({
    contractId: contract.id,
    eventType: 'signature_completed',
    signatureMethod: 'govbr',
    contractHash: contractHash,
    signerIdentifier: govbrUserId,
    ipAddress: ipAddress,
    userAgent: userAgent,
    metadata: {
      signedAt: new Date().toISOString(),
      authMethod: 'govbr_oauth',
      trustLevel: 'advanced',
    },
  });
  
  console.log('GOV.BR signature recorded:', auditLog.id);
  return auditLog;
}
```

### Example 2: Create Audit Log for Email Signature

```typescript
import { createAuditLog } from '@/lib/services/audit-log';
import { generateContractHash } from '@/lib/services/contract-hash';

// After successful email verification
async function recordEmailSignature(
  contract: Contract,
  email: string,
  ipAddress: string,
  userAgent: string
) {
  // Generate the contract hash
  const contractHash = generateContractHash(contract);
  
  // Create the audit log entry
  const auditLog = await createAuditLog({
    contractId: contract.id,
    eventType: 'signature_completed',
    signatureMethod: 'email',
    contractHash: contractHash,
    signerIdentifier: email,
    ipAddress: ipAddress,
    userAgent: userAgent,
    metadata: {
      signedAt: new Date().toISOString(),
      authMethod: 'email_verification',
      trustLevel: 'admitted',
      verificationCodeSent: true,
    },
  });
  
  console.log('Email signature recorded:', auditLog.id);
  return auditLog;
}
```

### Example 3: Record Signature Initiation

```typescript
import { createAuditLog } from '@/lib/services/audit-log';

// When user starts the signature process
async function recordSignatureInitiation(
  contractId: string,
  signatureMethod: 'govbr' | 'email',
  ipAddress: string,
  userAgent: string
) {
  const auditLog = await createAuditLog({
    contractId: contractId,
    eventType: 'signature_initiated',
    signatureMethod: signatureMethod,
    contractHash: '', // No hash yet, signature not completed
    ipAddress: ipAddress,
    userAgent: userAgent,
    metadata: {
      initiatedAt: new Date().toISOString(),
      method: signatureMethod,
    },
  });
  
  console.log('Signature initiation recorded:', auditLog.id);
  return auditLog;
}
```

### Example 4: Record Failed Signature Attempt

```typescript
import { createAuditLog } from '@/lib/services/audit-log';

// When signature verification fails
async function recordSignatureFailure(
  contractId: string,
  signatureMethod: 'govbr' | 'email',
  ipAddress: string,
  userAgent: string,
  failureReason: string
) {
  const auditLog = await createAuditLog({
    contractId: contractId,
    eventType: 'signature_failed',
    signatureMethod: signatureMethod,
    contractHash: '', // No hash, signature failed
    signerIdentifier: undefined,
    ipAddress: ipAddress,
    userAgent: userAgent,
    metadata: {
      failedAt: new Date().toISOString(),
      reason: failureReason,
      attemptNumber: 1,
    },
  });
  
  console.log('Signature failure recorded:', auditLog.id);
  return auditLog;
}
```

### Example 5: Using Server-Side Client

```typescript
import { createAuditLog } from '@/lib/services/audit-log';

// In a Next.js API route or Server Component
export async function POST(request: Request) {
  const { contractId, eventType, signatureMethod, contractHash, ipAddress } = await request.json();
  
  // Use server-side client for API routes
  const auditLog = await createAuditLog(
    {
      contractId,
      eventType,
      signatureMethod,
      contractHash,
      ipAddress,
      userAgent: request.headers.get('user-agent') || undefined,
    },
    true // Use server client
  );
  
  return Response.json({ success: true, auditLog });
}
```

## Retrieving Audit Logs

### Example 6: Get All Audit Logs for a Contract

```typescript
import { getAuditLogsForContract } from '@/lib/services/audit-log';

// Retrieve complete audit trail
async function displayAuditTrail(contractId: string) {
  const logs = await getAuditLogsForContract(contractId);
  
  console.log(`Found ${logs.length} audit log entries:`);
  
  logs.forEach((log, index) => {
    console.log(`\n${index + 1}. ${log.eventType} (${log.signatureMethod})`);
    console.log(`   Time: ${log.createdAt}`);
    console.log(`   Signer: ${log.signerIdentifier || 'N/A'}`);
    console.log(`   IP: ${log.ipAddress}`);
    console.log(`   Hash: ${log.contractHash || 'N/A'}`);
  });
  
  return logs;
}
```

### Example 7: Get Latest Audit Log Entry

```typescript
import { getLatestAuditLog } from '@/lib/services/audit-log';

// Check current signature status
async function checkSignatureStatus(contractId: string) {
  const latestLog = await getLatestAuditLog(contractId);
  
  if (!latestLog) {
    console.log('No audit logs found for this contract');
    return null;
  }
  
  if (latestLog.eventType === 'signature_completed') {
    console.log('Contract is signed');
    console.log(`Signed by: ${latestLog.signerIdentifier}`);
    console.log(`Signed at: ${latestLog.createdAt}`);
    console.log(`Method: ${latestLog.signatureMethod}`);
    console.log(`Hash: ${latestLog.contractHash}`);
  } else if (latestLog.eventType === 'signature_initiated') {
    console.log('Signature in progress');
  } else if (latestLog.eventType === 'signature_failed') {
    console.log('Last signature attempt failed');
  }
  
  return latestLog;
}
```

## Filtering Audit Logs

### Example 8: Get Only Completed Signatures

```typescript
import { getAuditLogsByEventType } from '@/lib/services/audit-log';

// Retrieve only successful signature events
async function getSignatureHistory(contractId: string) {
  const signatureLogs = await getAuditLogsByEventType(
    contractId,
    'signature_completed'
  );
  
  console.log(`Contract has ${signatureLogs.length} completed signature(s)`);
  
  signatureLogs.forEach((log) => {
    console.log(`- Signed via ${log.signatureMethod} by ${log.signerIdentifier}`);
    console.log(`  At: ${log.createdAt}`);
    console.log(`  Hash: ${log.contractHash}`);
  });
  
  return signatureLogs;
}
```

### Example 9: Get Failed Signature Attempts

```typescript
import { getAuditLogsByEventType } from '@/lib/services/audit-log';

// Analyze failed signature attempts for security monitoring
async function analyzeFailedAttempts(contractId: string) {
  const failedLogs = await getAuditLogsByEventType(
    contractId,
    'signature_failed'
  );
  
  if (failedLogs.length === 0) {
    console.log('No failed signature attempts');
    return [];
  }
  
  console.log(`Found ${failedLogs.length} failed attempt(s):`);
  
  failedLogs.forEach((log) => {
    console.log(`- Failed at: ${log.createdAt}`);
    console.log(`  IP: ${log.ipAddress}`);
    console.log(`  Method: ${log.signatureMethod}`);
    console.log(`  Reason: ${log.metadata?.reason || 'Unknown'}`);
  });
  
  // Check for suspicious activity (multiple failures from same IP)
  const ipCounts = failedLogs.reduce((acc, log) => {
    acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(ipCounts).forEach(([ip, count]) => {
    if (count >= 3) {
      console.warn(`⚠️  Suspicious: ${count} failed attempts from IP ${ip}`);
    }
  });
  
  return failedLogs;
}
```

## Verifying Audit Log Hashes

### Example 10: Verify Contract Integrity

```typescript
import { verifyAuditLogHash } from '@/lib/services/audit-log';
import { generateContractHash, verifyContractHash } from '@/lib/services/contract-hash';
import { getLatestAuditLog } from '@/lib/services/audit-log';

// Verify that contract hasn't been tampered with
async function verifyContractIntegrity(contract: Contract) {
  // Get the latest audit log (should be signature_completed)
  const latestLog = await getLatestAuditLog(contract.id);
  
  if (!latestLog || latestLog.eventType !== 'signature_completed') {
    console.log('Contract is not signed yet');
    return false;
  }
  
  // Recalculate the hash from current contract content
  const currentHash = generateContractHash(contract);
  
  // Compare with stored hash in audit log
  const isValid = verifyContractHash(contract, latestLog.contractHash);
  
  if (isValid) {
    console.log('✓ Contract integrity verified');
    console.log(`  Stored hash: ${latestLog.contractHash}`);
    console.log(`  Current hash: ${currentHash}`);
    console.log(`  Signed at: ${latestLog.createdAt}`);
    console.log(`  Signed by: ${latestLog.signerIdentifier}`);
  } else {
    console.error('✗ Contract integrity check FAILED');
    console.error('  Contract may have been tampered with!');
    console.error(`  Expected hash: ${latestLog.contractHash}`);
    console.error(`  Current hash: ${currentHash}`);
  }
  
  return isValid;
}
```

### Example 11: Verify Specific Hash Exists

```typescript
import { verifyAuditLogHash } from '@/lib/services/audit-log';

// Check if a specific hash was ever recorded for this contract
async function checkHashInAuditTrail(contractId: string, hash: string) {
  const exists = await verifyAuditLogHash(contractId, hash);
  
  if (exists) {
    console.log('✓ Hash found in audit trail');
    console.log('  This version of the contract was signed');
  } else {
    console.log('✗ Hash not found in audit trail');
    console.log('  This version was never signed');
  }
  
  return exists;
}
```

## Integration Examples

### Example 12: Complete Signature Flow with Audit Trail

```typescript
import { createAuditLog, getAuditLogsForContract } from '@/lib/services/audit-log';
import { generateContractHash } from '@/lib/services/contract-hash';

// Complete signature workflow with full audit trail
async function completeSignatureWorkflow(
  contract: Contract,
  signatureMethod: 'govbr' | 'email',
  signerIdentifier: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    // Step 1: Record signature initiation
    await createAuditLog({
      contractId: contract.id,
      eventType: 'signature_initiated',
      signatureMethod: signatureMethod,
      contractHash: '',
      ipAddress: ipAddress,
      userAgent: userAgent,
      metadata: {
        initiatedAt: new Date().toISOString(),
      },
    });
    
    // Step 2: Perform signature verification (simulated)
    const verificationSuccess = true; // Replace with actual verification
    
    if (!verificationSuccess) {
      // Record failure
      await createAuditLog({
        contractId: contract.id,
        eventType: 'signature_failed',
        signatureMethod: signatureMethod,
        contractHash: '',
        ipAddress: ipAddress,
        userAgent: userAgent,
        metadata: {
          failedAt: new Date().toISOString(),
          reason: 'Verification failed',
        },
      });
      throw new Error('Signature verification failed');
    }
    
    // Step 3: Generate contract hash
    const contractHash = generateContractHash(contract);
    
    // Step 4: Record successful signature
    const completedLog = await createAuditLog({
      contractId: contract.id,
      eventType: 'signature_completed',
      signatureMethod: signatureMethod,
      contractHash: contractHash,
      signerIdentifier: signerIdentifier,
      ipAddress: ipAddress,
      userAgent: userAgent,
      metadata: {
        signedAt: new Date().toISOString(),
        trustLevel: signatureMethod === 'govbr' ? 'advanced' : 'admitted',
      },
    });
    
    // Step 5: Retrieve complete audit trail
    const auditTrail = await getAuditLogsForContract(contract.id);
    
    console.log('Signature completed successfully');
    console.log(`Audit trail has ${auditTrail.length} entries`);
    
    return {
      success: true,
      auditLog: completedLog,
      auditTrail: auditTrail,
    };
  } catch (error) {
    console.error('Signature workflow failed:', error);
    throw error;
  }
}
```

### Example 13: Admin Dashboard - Display Audit Trail

```typescript
import { getAuditLogsForContract } from '@/lib/services/audit-log';

// Display audit trail in admin dashboard
async function renderAuditTrailForAdmin(contractId: string) {
  const logs = await getAuditLogsForContract(contractId);
  
  const timeline = logs.map((log) => {
    let icon = '📝';
    let color = 'gray';
    let title = log.eventType;
    
    switch (log.eventType) {
      case 'contract_created':
        icon = '📄';
        color = 'blue';
        title = 'Contract Created';
        break;
      case 'signature_initiated':
        icon = '🔄';
        color = 'yellow';
        title = 'Signature Started';
        break;
      case 'signature_completed':
        icon = '✅';
        color = 'green';
        title = 'Signature Completed';
        break;
      case 'signature_failed':
        icon = '❌';
        color = 'red';
        title = 'Signature Failed';
        break;
      case 'contract_viewed':
        icon = '👁️';
        color = 'gray';
        title = 'Contract Viewed';
        break;
    }
    
    return {
      icon,
      color,
      title,
      timestamp: new Date(log.createdAt).toLocaleString('pt-BR'),
      method: log.signatureMethod,
      signer: log.signerIdentifier || 'System',
      ip: log.ipAddress,
      hash: log.contractHash || 'N/A',
      metadata: log.metadata,
    };
  });
  
  return timeline;
}
```

### Example 14: Legal Compliance Report

```typescript
import { getAuditLogsForContract } from '@/lib/services/audit-log';
import { verifyContractHash } from '@/lib/services/contract-hash';

// Generate legal compliance report for a signed contract
async function generateComplianceReport(contract: Contract) {
  const logs = await getAuditLogsForContract(contract.id);
  
  // Find the signature completion log
  const signatureLog = logs.find(log => log.eventType === 'signature_completed');
  
  if (!signatureLog) {
    throw new Error('Contract is not signed');
  }
  
  // Verify integrity
  const isValid = verifyContractHash(contract, signatureLog.contractHash);
  
  const report = {
    contractId: contract.id,
    contractUuid: contract.uuid,
    contractorName: contract.contractorName,
    contractorCPF: contract.contractorCPF,
    
    signature: {
      method: signatureLog.signatureMethod,
      legalLevel: signatureLog.signatureMethod === 'govbr' ? 'Advanced (MP 2.200-2/2001)' : 'Admitted (Law 14.063/2020)',
      signerIdentifier: signatureLog.signerIdentifier,
      timestamp: signatureLog.createdAt,
      ipAddress: signatureLog.ipAddress,
      userAgent: signatureLog.userAgent,
    },
    
    integrity: {
      verified: isValid,
      contractHash: signatureLog.contractHash,
      verificationDate: new Date().toISOString(),
    },
    
    auditTrail: {
      totalEvents: logs.length,
      events: logs.map(log => ({
        type: log.eventType,
        timestamp: log.createdAt,
        method: log.signatureMethod,
      })),
    },
    
    compliance: {
      lgpdCompliant: true,
      immutableAuditTrail: true,
      cryptographicIntegrity: isValid,
      legallyBinding: isValid && signatureLog.eventType === 'signature_completed',
    },
  };
  
  console.log('=== LEGAL COMPLIANCE REPORT ===');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}
```

## Best Practices

1. **Always record signature initiation** before attempting signature verification
2. **Record failures** to maintain complete audit trail and detect suspicious activity
3. **Include metadata** for additional context (timestamps, reasons, device info)
4. **Use server-side client** in API routes for better security
5. **Verify integrity** regularly by comparing current hash with audit log hash
6. **Monitor failed attempts** for security and fraud detection
7. **Keep audit logs immutable** - never modify or delete entries
8. **Include IP addresses** for legal compliance and security tracking
9. **Store user agent strings** for device identification and debugging
10. **Generate compliance reports** for legal documentation and evidence

## Error Handling

```typescript
import { createAuditLog } from '@/lib/services/audit-log';

async function safeCreateAuditLog(input: AuditLogInput) {
  try {
    const auditLog = await createAuditLog(input);
    return { success: true, auditLog };
  } catch (error) {
    console.error('Failed to create audit log:', error);
    
    // Log to monitoring service
    // await logToMonitoring('audit_log_creation_failed', { error, input });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## Security Considerations

1. **Immutability**: Audit logs cannot be modified or deleted due to database-level policies
2. **IP Tracking**: All events record IP addresses for security and legal compliance
3. **Hash Verification**: Contract hashes ensure content integrity and detect tampering
4. **Access Control**: Only admins can view audit logs (enforced by RLS policies)
5. **Rate Limiting**: Implement rate limiting on signature endpoints to prevent abuse
6. **Encryption**: All data is encrypted in transit (TLS) and at rest (AES-256)

## Legal Compliance

The audit log service ensures compliance with:

- **MP 2.200-2/2001**: Brazilian digital signature law (Advanced signatures via GOV.BR)
- **Law 14.063/2020**: Electronic signature law (Admitted signatures via email)
- **LGPD**: Brazilian data protection law (secure storage, access control)

All audit logs provide legal evidence of contract execution and can be used in court proceedings.

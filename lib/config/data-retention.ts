/**
 * Data Retention Policy Configuration
 * 
 * Defines retention periods for different types of data
 * in compliance with LGPD and legal requirements.
 * 
 * Requirements: 11.6
 */

export const DATA_RETENTION_POLICY = {
  // Contracts must be retained for at least 5 years after signature
  // for legal and tax purposes
  contracts: {
    retentionPeriodYears: 5,
    description: 'Contratos assinados devem ser mantidos por 5 anos após a assinatura',
  },

  // Audit logs must be retained for the same period as contracts
  // for legal evidence purposes
  auditLogs: {
    retentionPeriodYears: 5,
    description: 'Logs de auditoria devem ser mantidos por 5 anos',
  },

  // Verification codes should be deleted after expiration
  verificationCodes: {
    retentionPeriodMinutes: 15,
    description: 'Códigos de verificação expiram após 15 minutos',
  },

  // Unsigned contracts can be deleted after 1 year of inactivity
  unsignedContracts: {
    retentionPeriodYears: 1,
    description: 'Contratos não assinados podem ser excluídos após 1 ano de inatividade',
  },
} as const;

/**
 * Calculates the deletion date for a given data type
 * 
 * @param dataType - Type of data (contracts, auditLogs, etc.)
 * @param referenceDate - Reference date (e.g., signature date, creation date)
 * @returns Date when the data can be deleted
 */
export function calculateDeletionDate(
  dataType: keyof typeof DATA_RETENTION_POLICY,
  referenceDate: Date
): Date {
  const policy = DATA_RETENTION_POLICY[dataType];
  const deletionDate = new Date(referenceDate);

  if ('retentionPeriodYears' in policy) {
    deletionDate.setFullYear(deletionDate.getFullYear() + policy.retentionPeriodYears);
  } else if ('retentionPeriodMinutes' in policy) {
    deletionDate.setMinutes(deletionDate.getMinutes() + policy.retentionPeriodMinutes);
  }

  return deletionDate;
}

/**
 * Checks if data can be deleted based on retention policy
 * 
 * @param dataType - Type of data
 * @param referenceDate - Reference date
 * @returns True if data can be deleted
 */
export function canDeleteData(
  dataType: keyof typeof DATA_RETENTION_POLICY,
  referenceDate: Date
): boolean {
  const deletionDate = calculateDeletionDate(dataType, referenceDate);
  return new Date() >= deletionDate;
}

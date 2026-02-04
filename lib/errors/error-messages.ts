/**
 * User-Friendly Error Messages
 * 
 * Centralized error messages for consistent user experience.
 * Messages are in Portuguese for Brazilian users.
 * 
 * Requirements: All error handling requirements
 */

export const ERROR_MESSAGES = {
  // Validation Errors
  VALIDATION: {
    CPF_INVALID_LENGTH: 'CPF deve conter exatamente 11 dígitos',
    CPF_INVALID_PATTERN: 'CPF não pode ter todos os dígitos iguais',
    CPF_INVALID_CHECK_DIGITS: 'CPF com dígitos verificadores inválidos',
    CPF_INVALID: 'CPF inválido',
    CEP_INVALID_LENGTH: 'CEP deve conter exatamente 8 dígitos',
    CEP_INVALID_FORMAT: 'Formato de CEP inválido',
    VALUE_NOT_POSITIVE: 'O valor do contrato deve ser maior que zero',
    KWP_NOT_POSITIVE: 'A capacidade solar (kWp) deve ser maior que zero',
    REQUIRED_FIELD: 'Este campo é obrigatório',
    INVALID_EMAIL: 'E-mail inválido',
    INVALID_PHONE: 'Telefone inválido',
  },

  // External API Errors
  EXTERNAL_API: {
    VIACEP_TIMEOUT: 'Busca de endereço expirou. Por favor, insira o endereço manualmente.',
    VIACEP_NOT_FOUND: 'CEP não encontrado. Por favor, verifique o código postal ou insira o endereço manualmente.',
    VIACEP_ERROR: 'Erro ao buscar endereço. Por favor, insira o endereço manualmente.',
    GOOGLE_MAPS_UNAVAILABLE: 'Serviço de mapa indisponível. O pin de localização é opcional.',
    GOOGLE_MAPS_GEOCODING_FAILED: 'Não foi possível localizar o endereço no mapa. Você pode posicionar o pin manualmente.',
    GOOGLE_MAPS_COORDINATES_INVALID: 'A localização deve estar dentro do Brasil. Por favor, ajuste o pin.',
    GOOGLE_MAPS_TIMEOUT: 'Carregamento do mapa expirou. O pin de localização é opcional.',
    GOVBR_AUTH_DENIED: 'Autorização GOV.BR foi cancelada. Por favor, tente novamente ou use assinatura por e-mail.',
    GOVBR_TIMEOUT: 'Autenticação GOV.BR expirou. Por favor, tente novamente.',
    GOVBR_INVALID_CALLBACK: 'Erro de autenticação. Por favor, entre em contato com o suporte.',
  },

  // Signature Errors
  SIGNATURE: {
    INVALID_CODE: 'Código de verificação incorreto. Por favor, tente novamente.',
    EXPIRED_CODE: 'Código de verificação expirou. Por favor, solicite um novo código.',
    TOO_MANY_ATTEMPTS: 'Muitas tentativas falhadas. Por favor, solicite um novo código.',
    ALREADY_SIGNED: 'Este contrato já foi assinado e não pode ser modificado.',
    CONTRACT_NOT_FOUND: 'Contrato não encontrado. Por favor, verifique a URL.',
    INVALID_UUID: 'Link de contrato inválido. Por favor, verifique a URL.',
    EMAIL_SEND_FAILED: 'Falha ao enviar e-mail de verificação. Por favor, tente novamente.',
  },

  // Contract State Errors
  CONTRACT: {
    NOT_FOUND: 'Contrato não encontrado',
    ALREADY_SIGNED: 'Este contrato já foi assinado e não pode ser modificado',
    INVALID_STATUS: 'Status do contrato inválido',
    CREATION_FAILED: 'Falha ao criar contrato. Por favor, tente novamente.',
    UPDATE_FAILED: 'Falha ao atualizar contrato. Por favor, tente novamente.',
  },

  // Database Errors
  DATABASE: {
    CONNECTION_FAILED: 'Erro de conexão com o banco de dados. Por favor, tente novamente.',
    QUERY_FAILED: 'Erro ao consultar dados. Por favor, tente novamente.',
    CONSTRAINT_VIOLATION: 'Registro referenciado não encontrado. Por favor, atualize e tente novamente.',
    UNIQUE_VIOLATION: 'Registro duplicado. Por favor, verifique os dados.',
    FOREIGN_KEY_VIOLATION: 'Registro referenciado não encontrado. Por favor, atualize e tente novamente.',
  },

  // Authentication & Authorization Errors
  AUTH: {
    UNAUTHORIZED: 'Acesso negado',
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    SESSION_EXPIRED: 'Sessão expirada. Por favor, faça login novamente.',
    ADMIN_REQUIRED: 'Autenticação de administrador necessária',
    MFA_REQUIRED: 'Autenticação multifator necessária',
    MFA_INVALID: 'Código de autenticação multifator inválido',
  },

  // Generic Errors
  GENERIC: {
    UNKNOWN_ERROR: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    NETWORK_ERROR: 'Erro de rede. Por favor, verifique sua conexão.',
    TIMEOUT: 'A operação expirou. Por favor, tente novamente.',
    SERVER_ERROR: 'Erro no servidor. Nossa equipe foi notificada.',
    NOT_FOUND: 'Recurso não encontrado',
    BAD_REQUEST: 'Requisição inválida',
    FORBIDDEN: 'Acesso proibido',
  },
} as const;

/**
 * Gets a user-friendly error message from an error object
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if error message matches any predefined messages
    for (const category of Object.values(ERROR_MESSAGES)) {
      for (const message of Object.values(category)) {
        if (error.message.includes(message)) {
          return message;
        }
      }
    }
    
    // Return error message if it's user-friendly
    if (error.message && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // Default generic error
  return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
}

/**
 * Creates an error response object for API routes
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
) {
  return {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...details,
  };
}

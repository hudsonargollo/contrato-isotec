/**
 * WhatsApp Business Integration Types
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

import { z } from 'zod';

// WhatsApp Template Types
export const WhatsAppTemplateCategory = z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']);
export type WhatsAppTemplateCategory = z.infer<typeof WhatsAppTemplateCategory>;

export const WhatsAppTemplateStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISABLED']);
export type WhatsAppTemplateStatus = z.infer<typeof WhatsAppTemplateStatus>;

export const WhatsAppApprovalStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type WhatsAppApprovalStatus = z.infer<typeof WhatsAppApprovalStatus>;

export const WhatsAppTemplateComponentType = z.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']);
export type WhatsAppTemplateComponentType = z.infer<typeof WhatsAppTemplateComponentType>;

export const WhatsAppButtonType = z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']);
export type WhatsAppButtonType = z.infer<typeof WhatsAppButtonType>;

// Template Component Schemas
export const WhatsAppTemplateParameter = z.object({
  type: z.enum(['text', 'currency', 'date_time', 'image', 'document', 'video']),
  text: z.string().optional(),
  currency: z.object({
    fallback_value: z.string(),
    code: z.string(),
    amount_1000: z.number()
  }).optional(),
  date_time: z.object({
    fallback_value: z.string()
  }).optional(),
  image: z.object({
    link: z.string().optional(),
    id: z.string().optional()
  }).optional(),
  document: z.object({
    link: z.string().optional(),
    id: z.string().optional(),
    filename: z.string().optional()
  }).optional(),
  video: z.object({
    link: z.string().optional(),
    id: z.string().optional()
  }).optional()
});

export const WhatsAppTemplateComponent = z.object({
  type: WhatsAppTemplateComponentType,
  format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  text: z.string().optional(),
  example: z.object({
    header_text: z.array(z.string()).optional(),
    body_text: z.array(z.array(z.string())).optional()
  }).optional(),
  parameters: z.array(WhatsAppTemplateParameter).optional()
});

export const WhatsAppTemplateButton = z.object({
  type: WhatsAppButtonType,
  text: z.string(),
  url: z.string().optional(),
  phone_number: z.string().optional()
});

// Main Template Schema
export const WhatsAppTemplate = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(512),
  category: WhatsAppTemplateCategory,
  language: z.string().default('en_US'),
  status: WhatsAppTemplateStatus.default('PENDING'),
  
  // Template components
  header: WhatsAppTemplateComponent.optional(),
  body: WhatsAppTemplateComponent,
  footer: WhatsAppTemplateComponent.optional(),
  buttons: z.array(WhatsAppTemplateButton).optional(),
  
  // Meta template information
  meta_template_id: z.string().optional(),
  quality_score: z.string().optional(),
  rejection_reason: z.string().optional(),
  
  // Approval workflow
  approval_status: WhatsAppApprovalStatus.default('PENDING'),
  approved_by: z.string().uuid().optional(),
  approved_at: z.date().optional(),
  
  // Audit fields
  created_by: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date()
});

export type WhatsAppTemplate = z.infer<typeof WhatsAppTemplate>;

// Message Types
export const WhatsAppMessageType = z.enum([
  'text', 'template', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'interactive'
]);
export type WhatsAppMessageType = z.infer<typeof WhatsAppMessageType>;

export const WhatsAppMessageStatus = z.enum(['pending', 'sent', 'delivered', 'read', 'failed']);
export type WhatsAppMessageStatus = z.infer<typeof WhatsAppMessageStatus>;

export const WhatsAppMessageDirection = z.enum(['inbound', 'outbound']);
export type WhatsAppMessageDirection = z.infer<typeof WhatsAppMessageDirection>;

// Message Content Schemas
export const WhatsAppTextContent = z.object({
  body: z.string()
});

export const WhatsAppTemplateContent = z.object({
  name: z.string(),
  language: z.object({
    code: z.string()
  }),
  components: z.array(WhatsAppTemplateComponent).optional()
});

export const WhatsAppMediaContent = z.object({
  id: z.string().optional(),
  link: z.string().optional(),
  caption: z.string().optional(),
  filename: z.string().optional()
});

export const WhatsAppLocationContent = z.object({
  longitude: z.number(),
  latitude: z.number(),
  name: z.string().optional(),
  address: z.string().optional()
});

export const WhatsAppContactContent = z.object({
  addresses: z.array(z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    country_code: z.string().optional(),
    type: z.enum(['HOME', 'WORK']).optional()
  })).optional(),
  birthday: z.string().optional(),
  emails: z.array(z.object({
    email: z.string(),
    type: z.enum(['HOME', 'WORK']).optional()
  })).optional(),
  name: z.object({
    formatted_name: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    middle_name: z.string().optional(),
    suffix: z.string().optional(),
    prefix: z.string().optional()
  }),
  org: z.object({
    company: z.string().optional(),
    department: z.string().optional(),
    title: z.string().optional()
  }).optional(),
  phones: z.array(z.object({
    phone: z.string(),
    wa_id: z.string().optional(),
    type: z.enum(['HOME', 'WORK']).optional()
  })).optional(),
  urls: z.array(z.object({
    url: z.string(),
    type: z.enum(['HOME', 'WORK']).optional()
  })).optional()
});

export const WhatsAppInteractiveContent = z.object({
  type: z.enum(['button', 'list']),
  header: z.object({
    type: z.enum(['text', 'image', 'video', 'document']),
    text: z.string().optional(),
    image: WhatsAppMediaContent.optional(),
    video: WhatsAppMediaContent.optional(),
    document: WhatsAppMediaContent.optional()
  }).optional(),
  body: z.object({
    text: z.string()
  }),
  footer: z.object({
    text: z.string()
  }).optional(),
  action: z.object({
    buttons: z.array(z.object({
      type: z.literal('reply'),
      reply: z.object({
        id: z.string(),
        title: z.string()
      })
    })).optional(),
    button: z.string().optional(),
    sections: z.array(z.object({
      title: z.string().optional(),
      rows: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional()
      }))
    })).optional()
  })
});

// Main Message Schema
export const WhatsAppMessage = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  
  // Message identification
  message_id: z.string().optional(),
  conversation_id: z.string().optional(),
  
  // Sender/Recipient information
  from_phone_number: z.string(),
  to_phone_number: z.string(),
  direction: WhatsAppMessageDirection,
  
  // Message content
  message_type: WhatsAppMessageType,
  content: z.union([
    WhatsAppTextContent,
    WhatsAppTemplateContent,
    WhatsAppMediaContent,
    WhatsAppLocationContent,
    WhatsAppContactContent,
    WhatsAppInteractiveContent,
    z.record(z.any()) // Fallback for other content types
  ]),
  
  // Template information
  template_id: z.string().uuid().optional(),
  template_name: z.string().optional(),
  template_language: z.string().optional(),
  
  // Message status
  status: WhatsAppMessageStatus.default('pending'),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  
  // Timestamps
  sent_at: z.date().optional(),
  delivered_at: z.date().optional(),
  read_at: z.date().optional(),
  
  // CRM integration
  customer_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  interaction_id: z.string().uuid().optional(),
  
  // Audit fields
  created_by: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

export type WhatsAppMessage = z.infer<typeof WhatsAppMessage>;

// Phone Number Types
export const WhatsAppPhoneNumberStatus = z.enum(['pending', 'verified', 'unverified', 'restricted']);
export type WhatsAppPhoneNumberStatus = z.infer<typeof WhatsAppPhoneNumberStatus>;

export const WhatsAppPhoneNumber = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  
  phone_number: z.string(),
  phone_number_id: z.string(),
  display_name: z.string().optional(),
  
  status: WhatsAppPhoneNumberStatus.default('pending'),
  verified_name: z.string().optional(),
  
  is_primary: z.boolean().default(false),
  webhook_url: z.string().optional(),
  
  business_profile: z.record(z.any()).optional(),
  
  created_by: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date()
});

export type WhatsAppPhoneNumber = z.infer<typeof WhatsAppPhoneNumber>;

// Conversation Types
export const WhatsAppConversationStatus = z.enum(['active', 'closed', 'archived']);
export type WhatsAppConversationStatus = z.infer<typeof WhatsAppConversationStatus>;

export const WhatsAppConversation = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  
  conversation_id: z.string(),
  phone_number: z.string(),
  customer_phone: z.string(),
  
  status: WhatsAppConversationStatus.default('active'),
  last_message_at: z.date().optional(),
  message_count: z.number().default(0),
  
  customer_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  
  context: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  
  created_at: z.date(),
  updated_at: z.date()
});

export type WhatsAppConversation = z.infer<typeof WhatsAppConversation>;

// Campaign Types
export const WhatsAppCampaignStatus = z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']);
export type WhatsAppCampaignStatus = z.infer<typeof WhatsAppCampaignStatus>;

export const WhatsAppCampaign = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  
  name: z.string(),
  description: z.string().optional(),
  status: WhatsAppCampaignStatus.default('draft'),
  
  template_id: z.string().uuid(),
  target_audience: z.record(z.any()),
  
  scheduled_at: z.date().optional(),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  
  total_recipients: z.number().default(0),
  messages_sent: z.number().default(0),
  messages_delivered: z.number().default(0),
  messages_read: z.number().default(0),
  messages_failed: z.number().default(0),
  
  created_by: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date()
});

export type WhatsAppCampaign = z.infer<typeof WhatsAppCampaign>;

// Campaign Recipient Types
export const WhatsAppCampaignRecipientStatus = z.enum(['pending', 'sent', 'delivered', 'read', 'failed']);
export type WhatsAppCampaignRecipientStatus = z.infer<typeof WhatsAppCampaignRecipientStatus>;

export const WhatsAppCampaignRecipient = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  
  phone_number: z.string(),
  customer_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  
  message_id: z.string().uuid().optional(),
  status: WhatsAppCampaignRecipientStatus.default('pending'),
  
  template_variables: z.record(z.any()).default({}),
  
  sent_at: z.date().optional(),
  delivered_at: z.date().optional(),
  read_at: z.date().optional(),
  
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  retry_count: z.number().default(0),
  
  created_at: z.date(),
  updated_at: z.date()
});

export type WhatsAppCampaignRecipient = z.infer<typeof WhatsAppCampaignRecipient>;

// Webhook Event Types
export const WhatsAppWebhookEvent = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  
  webhook_id: z.string(),
  event_type: z.string(),
  
  payload: z.record(z.any()),
  
  processed: z.boolean().default(false),
  processed_at: z.date().optional(),
  error_message: z.string().optional(),
  
  message_id: z.string().uuid().optional(),
  
  created_at: z.date(),
  updated_at: z.date()
});

export type WhatsAppWebhookEvent = z.infer<typeof WhatsAppWebhookEvent>;

// API Request/Response Types
export interface SendMessageRequest {
  to: string;
  type: WhatsAppMessageType;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters?: Array<{
        type: string;
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
      }>;
    }>;
  };
  image?: WhatsAppMediaContent;
  document?: WhatsAppMediaContent;
  audio?: WhatsAppMediaContent;
  video?: WhatsAppMediaContent;
  location?: WhatsAppLocationContent;
  contacts?: WhatsAppContactContent[];
  interactive?: WhatsAppInteractiveContent;
}

export interface SendMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          context?: {
            from: string;
            id: string;
          };
          text?: {
            body: string;
          };
          image?: {
            caption?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          document?: {
            caption?: string;
            filename?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          audio?: {
            mime_type: string;
            sha256: string;
            id: string;
            voice: boolean;
          };
          video?: {
            caption?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
          };
          contacts?: WhatsAppContactContent[];
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
              description?: string;
            };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            expiration_timestamp?: string;
            origin: {
              type: string;
            };
          };
          pricing?: {
            billable: boolean;
            pricing_model: string;
            category: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message?: string;
            error_data?: {
              details: string;
            };
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

// Service Configuration Types
export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion?: string;
  baseUrl?: string;
}

// Error Types
export class WhatsAppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'WhatsAppError';
  }
}

export class WhatsAppWebhookError extends Error {
  constructor(
    message: string,
    public payload?: any,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WhatsAppWebhookError';
  }
}

// Utility Types
export interface WhatsAppMessageDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export interface WhatsAppTemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WhatsAppCampaignResult {
  campaignId: string;
  totalRecipients: number;
  successfulSends: number;
  failedSends: number;
  errors: Array<{
    recipient: string;
    error: string;
  }>;
}
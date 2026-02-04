/**
 * Unit tests for Zod validation schemas
 * 
 * These tests verify that the Zod schemas correctly validate
 * contract data according to the design specifications.
 */

import {
  coordinatesSchema,
  cpfSchema,
  cepSchema,
  positiveValueSchema,
  serviceItemSchema,
  equipmentItemInputSchema,
  paymentMethodSchema,
  contractStatusSchema,
  contractDraftSchema,
  emailVerificationCodeSchema,
} from '../../../lib/types/schemas';

describe('Zod Validation Schemas', () => {
  describe('coordinatesSchema', () => {
    it('should accept valid Brazilian coordinates', () => {
      const validCoords = {
        latitude: -23.55052,
        longitude: -46.633308
      };
      
      const result = coordinatesSchema.safeParse(validCoords);
      expect(result.success).toBe(true);
    });

    it('should reject coordinates outside Brazil boundaries', () => {
      const invalidLat = {
        latitude: 50.0, // Too far north
        longitude: -46.633308
      };
      
      const result = coordinatesSchema.safeParse(invalidLat);
      expect(result.success).toBe(false);
    });

    it('should reject coordinates with too many decimal places', () => {
      const tooManyDecimals = {
        latitude: -23.550520001, // 9 decimal places
        longitude: -46.633308
      };
      
      const result = coordinatesSchema.safeParse(tooManyDecimals);
      expect(result.success).toBe(false);
    });
  });

  describe('cpfSchema', () => {
    it('should accept valid CPF with formatting', () => {
      const result = cpfSchema.safeParse('123.456.789-09');
      expect(result.success).toBe(true);
    });

    it('should accept valid CPF without formatting', () => {
      const result = cpfSchema.safeParse('12345678909');
      expect(result.success).toBe(true);
    });

    it('should reject invalid CPF', () => {
      const result = cpfSchema.safeParse('123.456.789-00');
      expect(result.success).toBe(false);
    });

    it('should reject CPF with all same digits', () => {
      const result = cpfSchema.safeParse('111.111.111-11');
      expect(result.success).toBe(false);
    });
  });

  describe('cepSchema', () => {
    it('should accept valid CEP with formatting', () => {
      const result = cepSchema.safeParse('12345-678');
      expect(result.success).toBe(true);
    });

    it('should accept valid CEP without formatting', () => {
      const result = cepSchema.safeParse('12345678');
      expect(result.success).toBe(true);
    });

    it('should reject CEP with wrong length', () => {
      const result = cepSchema.safeParse('1234567');
      expect(result.success).toBe(false);
    });
  });

  describe('positiveValueSchema', () => {
    it('should accept positive numbers', () => {
      const result = positiveValueSchema.safeParse(100.50);
      expect(result.success).toBe(true);
    });

    it('should reject zero', () => {
      const result = positiveValueSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative numbers', () => {
      const result = positiveValueSchema.safeParse(-10);
      expect(result.success).toBe(false);
    });

    it('should reject values with more than 2 decimal places', () => {
      const result = positiveValueSchema.safeParse(100.123);
      expect(result.success).toBe(false);
    });
  });

  describe('serviceItemSchema', () => {
    it('should accept valid service item', () => {
      const validService = {
        description: 'Installation service',
        included: true
      };
      
      const result = serviceItemSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it('should reject service without description', () => {
      const invalidService = {
        description: '',
        included: true
      };
      
      const result = serviceItemSchema.safeParse(invalidService);
      expect(result.success).toBe(false);
    });
  });

  describe('equipmentItemInputSchema', () => {
    it('should accept valid equipment item', () => {
      const validItem = {
        itemName: 'Solar Panel 550W',
        quantity: 10,
        unit: 'un',
        sortOrder: 0
      };
      
      const result = equipmentItemInputSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject equipment with negative quantity', () => {
      const invalidItem = {
        itemName: 'Solar Panel',
        quantity: -5,
        unit: 'un'
      };
      
      const result = equipmentItemInputSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject equipment with fractional quantity', () => {
      const invalidItem = {
        itemName: 'Solar Panel',
        quantity: 5.5,
        unit: 'un'
      };
      
      const result = equipmentItemInputSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentMethodSchema', () => {
    it('should accept valid payment methods', () => {
      expect(paymentMethodSchema.safeParse('pix').success).toBe(true);
      expect(paymentMethodSchema.safeParse('cash').success).toBe(true);
      expect(paymentMethodSchema.safeParse('credit').success).toBe(true);
    });

    it('should reject invalid payment method', () => {
      const result = paymentMethodSchema.safeParse('bitcoin');
      expect(result.success).toBe(false);
    });
  });

  describe('contractStatusSchema', () => {
    it('should accept valid contract statuses', () => {
      expect(contractStatusSchema.safeParse('pending_signature').success).toBe(true);
      expect(contractStatusSchema.safeParse('signed').success).toBe(true);
      expect(contractStatusSchema.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = contractStatusSchema.safeParse('draft');
      expect(result.success).toBe(false);
    });
  });

  describe('contractDraftSchema', () => {
    const validDraft = {
      contractorName: 'João Silva',
      contractorCPF: '123.456.789-09',
      contractorEmail: 'joao@example.com',
      contractorPhone: '11987654321',
      addressCEP: '12345-678',
      addressStreet: 'Rua das Flores',
      addressNumber: '123',
      addressComplement: 'Apto 45',
      addressNeighborhood: 'Centro',
      addressCity: 'São Paulo',
      addressState: 'SP',
      locationLatitude: -23.55052,
      locationLongitude: -46.633308,
      projectKWp: 10.5,
      installationDate: new Date('2024-06-01'),
      services: [
        { description: 'Installation', included: true },
        { description: 'Maintenance', included: false }
      ],
      items: [
        { itemName: 'Solar Panel 550W', quantity: 20, unit: 'un', sortOrder: 0 },
        { itemName: 'Inverter 10kW', quantity: 1, unit: 'un', sortOrder: 1 }
      ],
      contractValue: 50000.00,
      paymentMethod: 'pix' as const
    };

    it('should accept valid contract draft', () => {
      const result = contractDraftSchema.safeParse(validDraft);
      expect(result.success).toBe(true);
    });

    it('should reject draft with short contractor name', () => {
      const invalidDraft = { ...validDraft, contractorName: 'Jo' };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should reject draft with invalid CPF', () => {
      const invalidDraft = { ...validDraft, contractorCPF: '123.456.789-00' };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should reject draft with invalid email', () => {
      const invalidDraft = { ...validDraft, contractorEmail: 'invalid-email' };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should accept draft with empty optional fields', () => {
      const draftWithoutOptionals = {
        ...validDraft,
        contractorEmail: '',
        contractorPhone: '',
        addressComplement: '',
        locationLatitude: undefined,
        locationLongitude: undefined,
        installationDate: undefined
      };
      const result = contractDraftSchema.safeParse(draftWithoutOptionals);
      expect(result.success).toBe(true);
    });

    it('should reject draft with only latitude (missing longitude)', () => {
      const invalidDraft = {
        ...validDraft,
        locationLatitude: -23.55052,
        locationLongitude: undefined
      };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should reject draft with coordinates outside Brazil', () => {
      const invalidDraft = {
        ...validDraft,
        locationLatitude: 50.0, // Too far north
        locationLongitude: -46.633308
      };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should reject draft with zero contract value', () => {
      const invalidDraft = { ...validDraft, contractValue: 0 };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should reject draft with negative kWp', () => {
      const invalidDraft = { ...validDraft, projectKWp: -5 };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should reject draft with no services', () => {
      const invalidDraft = { ...validDraft, services: [] };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it('should reject draft with no equipment items', () => {
      const invalidDraft = { ...validDraft, items: [] };
      const result = contractDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });
  });

  describe('emailVerificationCodeSchema', () => {
    it('should accept valid 6-digit code', () => {
      const validCode = {
        code: '123456',
        contractId: '550e8400-e29b-41d4-a716-446655440000'
      };
      const result = emailVerificationCodeSchema.safeParse(validCode);
      expect(result.success).toBe(true);
    });

    it('should reject code with wrong length', () => {
      const invalidCode = {
        code: '12345',
        contractId: '550e8400-e29b-41d4-a716-446655440000'
      };
      const result = emailVerificationCodeSchema.safeParse(invalidCode);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric code', () => {
      const invalidCode = {
        code: '12345a',
        contractId: '550e8400-e29b-41d4-a716-446655440000'
      };
      const result = emailVerificationCodeSchema.safeParse(invalidCode);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const invalidCode = {
        code: '123456',
        contractId: 'not-a-uuid'
      };
      const result = emailVerificationCodeSchema.safeParse(invalidCode);
      expect(result.success).toBe(false);
    });
  });
});

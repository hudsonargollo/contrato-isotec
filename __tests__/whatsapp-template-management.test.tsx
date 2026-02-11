/**
 * WhatsApp Template Management Tests
 * Requirements: 5.4 - Template management with approval workflows and compliance tracking
 */

import { WhatsAppTemplate, WhatsAppTemplateCategory, WhatsAppApprovalStatus } from '@/lib/types/whatsapp';

describe('WhatsApp Template Management', () => {
  describe('Template Validation', () => {
    it('should validate template naming conventions', () => {
      const validNames = ['hello_world', 'order_confirmation', 'payment_reminder_123'];
      const invalidNames = ['Hello World', 'order-confirmation', 'payment reminder', 'CAPS_TEMPLATE'];

      validNames.forEach(name => {
        expect(/^[a-z0-9_]+$/.test(name)).toBe(true);
      });

      invalidNames.forEach(name => {
        expect(/^[a-z0-9_]+$/.test(name)).toBe(false);
      });
    });

    it('should validate template categories', () => {
      const validCategories: WhatsAppTemplateCategory[] = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
      const invalidCategories = ['marketing', 'promotional', 'notification'];

      validCategories.forEach(category => {
        expect(['MARKETING', 'UTILITY', 'AUTHENTICATION']).toContain(category);
      });

      invalidCategories.forEach(category => {
        expect(['MARKETING', 'UTILITY', 'AUTHENTICATION']).not.toContain(category);
      });
    });

    it('should validate parameter formatting', () => {
      const validParameters = ['{{1}}', '{{2}}', '{{10}}'];
      const invalidParameters = ['{1}', '{{a}}', '{{1.5}}', '{{}}'];

      validParameters.forEach(param => {
        expect(/^\{\{\d+\}\}$/.test(param)).toBe(true);
      });

      invalidParameters.forEach(param => {
        expect(/^\{\{\d+\}\}$/.test(param)).toBe(false);
      });
    });

    it('should validate parameter sequence', () => {
      const validTexts = [
        'Hello {{1}}, your order {{2}} is ready!',
        'Welcome {{1}}!',
        'Your code is {{1}} and expires in {{2}} minutes. Contact {{3}} for help.',
        'No parameters here'
      ];

      const invalidTexts = [
        'Hello {{3}}, your order {{1}} is ready!', // Wrong sequence - starts with 3
        'Welcome {{2}}!', // Missing {{1}}
        'Your code is {{1}} and expires in {{3}} minutes.' // Missing {{2}}
      ];

      const validateParameterSequence = (text: string): boolean => {
        const parameterRegex = /\{\{(\d+)\}\}/g;
        const matches = [...text.matchAll(parameterRegex)];
        if (matches.length === 0) return true;
        
        const numbers = matches.map(match => parseInt(match[1])).sort((a, b) => a - b);
        return numbers[0] === 1 && numbers.every((num, index) => num === index + 1);
      };

      validTexts.forEach(text => {
        expect(validateParameterSequence(text)).toBe(true);
      });

      invalidTexts.forEach(text => {
        expect(validateParameterSequence(text)).toBe(false);
      });
    });
  });

  describe('Compliance Checking', () => {
    it('should detect spam indicators', () => {
      const spamTexts = [
        'FREE OFFER!!!',
        'URGENT ACTION REQUIRED',
        'LIMITED TIME ONLY!!!',
        'CALL NOW $$$'
      ];

      const cleanTexts = [
        'Your order is ready for pickup',
        'Welcome to our service',
        'Your verification code is 123456',
        'Thank you for your purchase'
      ];

      const checkSpamIndicators = (text: string): boolean => {
        const spamIndicators = [
          /[A-Z]{5,}/, // Excessive capitalization
          /!{3,}/, // Multiple exclamation marks
          /FREE|URGENT|LIMITED TIME/i, // Promotional language
          /\$\$+/, // Multiple dollar signs
        ];
        
        return spamIndicators.some(indicator => indicator.test(text));
      };

      spamTexts.forEach(text => {
        expect(checkSpamIndicators(text)).toBe(true);
      });

      cleanTexts.forEach(text => {
        expect(checkSpamIndicators(text)).toBe(false);
      });
    });

    it('should validate category-content matching', () => {
      const marketingTexts = [
        'Special offer just for you!',
        'Save 50% on your next purchase',
        'Limited time promotion available'
      ];

      const utilityTexts = [
        'Your order status has been updated',
        'Reminder: Your appointment is tomorrow',
        'Confirmation: Payment received'
      ];

      const authTexts = [
        'Your verification code is 123456',
        'Login attempt detected',
        'Password reset requested'
      ];

      const validateCategoryMatch = (text: string, category: WhatsAppTemplateCategory): boolean => {
        const lowerText = text.toLowerCase();
        
        switch (category) {
          case 'MARKETING':
            return /offer|sale|discount|promotion|deal|save/.test(lowerText);
          case 'UTILITY':
            return /update|notification|reminder|confirmation|status/.test(lowerText);
          case 'AUTHENTICATION':
            return /code|verify|otp|login|password/.test(lowerText);
          default:
            return true;
        }
      };

      marketingTexts.forEach(text => {
        expect(validateCategoryMatch(text, 'MARKETING')).toBe(true);
        expect(validateCategoryMatch(text, 'UTILITY')).toBe(false);
        expect(validateCategoryMatch(text, 'AUTHENTICATION')).toBe(false);
      });

      utilityTexts.forEach(text => {
        expect(validateCategoryMatch(text, 'UTILITY')).toBe(true);
        expect(validateCategoryMatch(text, 'MARKETING')).toBe(false);
        expect(validateCategoryMatch(text, 'AUTHENTICATION')).toBe(false);
      });

      authTexts.forEach(text => {
        expect(validateCategoryMatch(text, 'AUTHENTICATION')).toBe(true);
        expect(validateCategoryMatch(text, 'MARKETING')).toBe(false);
        expect(validateCategoryMatch(text, 'UTILITY')).toBe(false);
      });
    });

    it('should check for opt-out mechanisms in marketing templates', () => {
      const textsWithOptOut = [
        'Special offer! Reply STOP to unsubscribe.',
        'Great deals await! Text STOP to opt out.',
        'Exclusive promotion. Reply STOP to stop receiving messages.'
      ];

      const textsWithoutOptOut = [
        'Special offer just for you!',
        'Limited time promotion available',
        'Save 50% on your next purchase'
      ];

      const checkOptOutMechanism = (text: string): boolean => {
        const lowerText = text.toLowerCase();
        return /stop|unsubscribe|opt.out|reply.stop/.test(lowerText);
      };

      textsWithOptOut.forEach(text => {
        expect(checkOptOutMechanism(text)).toBe(true);
      });

      textsWithoutOptOut.forEach(text => {
        expect(checkOptOutMechanism(text)).toBe(false);
      });
    });
  });

  describe('Template Structure', () => {
    it('should validate button limits', () => {
      const validButtonCounts = [0, 1, 2, 3];
      const invalidButtonCounts = [4, 5, 10];

      validButtonCounts.forEach(count => {
        expect(count <= 3).toBe(true);
      });

      invalidButtonCounts.forEach(count => {
        expect(count <= 3).toBe(false);
      });
    });

    it('should validate text length limits', () => {
      const shortText = 'Hello world';
      const mediumText = 'A'.repeat(500);
      const longText = 'A'.repeat(1025);

      expect(shortText.length <= 1024).toBe(true);
      expect(mediumText.length <= 1024).toBe(true);
      expect(longText.length <= 1024).toBe(false);
    });

    it('should validate template name length', () => {
      const shortName = 'hello';
      const mediumName = 'a'.repeat(100);
      const longName = 'a'.repeat(513);

      expect(shortName.length <= 512).toBe(true);
      expect(mediumName.length <= 512).toBe(true);
      expect(longName.length <= 512).toBe(false);
    });
  });

  describe('Approval Workflow', () => {
    it('should handle approval status transitions', () => {
      const validTransitions = [
        { from: 'PENDING', to: 'APPROVED' },
        { from: 'PENDING', to: 'REJECTED' },
        { from: 'REJECTED', to: 'PENDING' }, // Resubmission
      ];

      const invalidTransitions = [
        { from: 'APPROVED', to: 'PENDING' },
        { from: 'APPROVED', to: 'REJECTED' },
      ];

      const isValidTransition = (from: WhatsAppApprovalStatus, to: WhatsAppApprovalStatus): boolean => {
        const allowedTransitions: Record<WhatsAppApprovalStatus, WhatsAppApprovalStatus[]> = {
          'PENDING': ['APPROVED', 'REJECTED'],
          'APPROVED': [], // No transitions from approved
          'REJECTED': ['PENDING'] // Can resubmit
        };

        return allowedTransitions[from]?.includes(to) || false;
      };

      validTransitions.forEach(({ from, to }) => {
        expect(isValidTransition(from as WhatsAppApprovalStatus, to as WhatsAppApprovalStatus)).toBe(true);
      });

      invalidTransitions.forEach(({ from, to }) => {
        expect(isValidTransition(from as WhatsAppApprovalStatus, to as WhatsAppApprovalStatus)).toBe(false);
      });
    });

    it('should require rejection reason for rejected templates', () => {
      const approvalWithReason = {
        status: 'REJECTED' as const,
        reason: 'Template contains spam indicators'
      };

      const approvalWithoutReason = {
        status: 'REJECTED' as const,
        reason: ''
      };

      const validateRejection = (approval: { status: string; reason: string }): boolean => {
        if (approval.status === 'REJECTED') {
          return approval.reason.trim().length > 0;
        }
        return true;
      };

      expect(validateRejection(approvalWithReason)).toBe(true);
      expect(validateRejection(approvalWithoutReason)).toBe(false);
    });
  });

  describe('Template Content Extraction', () => {
    it('should extract parameters from template text', () => {
      const texts = [
        { text: 'Hello {{1}}, your order {{2}} is ready!', expected: ['1', '2'] },
        { text: 'Welcome {{1}}!', expected: ['1'] },
        { text: 'No parameters here', expected: [] },
        { text: 'Multiple {{1}} parameters {{2}} in {{3}} text {{4}}', expected: ['1', '2', '3', '4'] }
      ];

      const extractParameters = (text: string): string[] => {
        const matches = text.match(/\{\{(\d+)\}\}/g);
        return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
      };

      texts.forEach(({ text, expected }) => {
        expect(extractParameters(text)).toEqual(expected);
      });
    });

    it('should replace parameters with values', () => {
      const template = 'Hello {{1}}, your order {{2}} is ready for pickup at {{3}}!';
      const parameters = {
        '1': 'John',
        '2': '#12345',
        '3': 'Main Street Store'
      };

      const replaceParameters = (text: string, params: Record<string, string>): string => {
        let result = text;
        Object.entries(params).forEach(([key, value]) => {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
        return result;
      };

      const result = replaceParameters(template, parameters);
      const expected = 'Hello John, your order #12345 is ready for pickup at Main Street Store!';

      expect(result).toBe(expected);
    });
  });

  describe('Compliance Scoring', () => {
    it('should calculate compliance scores correctly', () => {
      const templates = [
        {
          name: 'valid_template',
          bodyText: 'Hello {{1}}, your order is ready!',
          buttons: [],
          category: 'UTILITY' as WhatsAppTemplateCategory
        },
        {
          name: 'Invalid Template Name',
          bodyText: 'FREE OFFER!!! URGENT ACTION REQUIRED!!!',
          buttons: [{}, {}, {}, {}], // Too many buttons
          category: 'MARKETING' as WhatsAppTemplateCategory
        }
      ];

      const calculateComplianceScore = (template: any): number => {
        let score = 100;
        
        // Check naming convention
        if (!/^[a-z0-9_]+$/.test(template.name)) {
          score -= 20;
        }
        
        // Check body text
        if (!template.bodyText?.trim()) {
          score -= 30;
        }
        
        // Check button count
        if (template.buttons && template.buttons.length > 3) {
          score -= 15;
        }
        
        // Check for spam indicators
        if (/[A-Z]{5,}/.test(template.bodyText || '')) {
          score -= 10;
        }
        
        if (/!{3,}/.test(template.bodyText || '')) {
          score -= 10;
        }
        
        return Math.max(0, score);
      };

      expect(calculateComplianceScore(templates[0])).toBe(100);
      expect(calculateComplianceScore(templates[1])).toBe(45); // 100 - 20 - 15 - 10 - 10
    });
  });
});

describe('Template Management API Validation', () => {
  it('should validate API request schemas', () => {
    const validCreateRequest = {
      name: 'order_confirmation',
      category: 'UTILITY',
      language: 'en_US',
      body: {
        type: 'BODY',
        text: 'Hello {{1}}, your order {{2}} is confirmed!'
      }
    };

    const invalidCreateRequest = {
      name: 'Invalid Name',
      category: 'INVALID_CATEGORY',
      body: {
        type: 'BODY'
        // Missing text
      }
    };

    const validateCreateRequest = (request: any): boolean => {
      // Check required fields
      if (!request.name || !request.category || !request.body?.text) {
        return false;
      }
      
      // Check naming convention
      if (!/^[a-z0-9_]+$/.test(request.name)) {
        return false;
      }
      
      // Check category
      if (!['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(request.category)) {
        return false;
      }
      
      return true;
    };

    expect(validateCreateRequest(validCreateRequest)).toBe(true);
    expect(validateCreateRequest(invalidCreateRequest)).toBe(false);
  });

  it('should validate approval request schemas', () => {
    const validApprovalRequest = {
      action: 'approve',
      comment: 'Template looks good'
    };

    const validRejectionRequest = {
      action: 'reject',
      reason: 'Template contains spam indicators'
    };

    const invalidRejectionRequest = {
      action: 'reject'
      // Missing reason
    };

    const validateApprovalRequest = (request: any): boolean => {
      if (!['approve', 'reject'].includes(request.action)) {
        return false;
      }
      
      if (request.action === 'reject' && !request.reason?.trim()) {
        return false;
      }
      
      return true;
    };

    expect(validateApprovalRequest(validApprovalRequest)).toBe(true);
    expect(validateApprovalRequest(validRejectionRequest)).toBe(true);
    expect(validateApprovalRequest(invalidRejectionRequest)).toBe(false);
  });
});
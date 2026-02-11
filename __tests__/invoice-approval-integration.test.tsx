/**
 * Invoice Approval Integration Tests
 * Basic integration tests for customer approval workflows
 * Requirements: 4.2 - Customer approval workflows
 */

import { InvoiceApprovalInterface } from '@/components/invoices/InvoiceApprovalInterface';
import { ApprovalWorkflowManager } from '@/components/invoices/ApprovalWorkflowManager';
import { PendingApprovalsWidget } from '@/components/invoices/PendingApprovalsWidget';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Invoice, InvoiceApprovalRequest } from '@/lib/types/invoice';
import { WorkflowExecution } from '@/lib/services/invoice-approval-workflows';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-invoice-id' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}));

describe('Invoice Approval Integration', () => {
  const mockInvoice: Invoice = {
    id: 'test-invoice-id',
    tenant_id: 'test-tenant-id',
    invoice_number: 'INV-2024-001',
    reference_number: undefined,
    customer_id: 'test-customer-id',
    customer_name: 'Test Customer',
    customer_email: 'customer@example.com',
    customer_phone: '+55 11 99999-9999',
    customer_address: {
      street: '123 Test Street',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      country: 'Brazil'
    },
    contract_id: undefined,
    lead_id: undefined,
    items: [
      {
        id: 'item-1',
        description: 'Solar Panel Installation',
        quantity: 1,
        unit_price: 5000.00,
        discount_percentage: undefined,
        discount_amount: undefined,
        tax_percentage: 10,
        tax_amount: 500.00,
        total_amount: 5500.00,
        metadata: {}
      }
    ],
    subtotal: 5000.00,
    discount_amount: 0.00,
    tax_amount: 500.00,
    total_amount: 5500.00,
    currency: 'BRL',
    payment_terms: '30 days',
    due_date: new Date('2024-03-15'),
    payment_instructions: 'Payment via bank transfer',
    status: 'pending_approval',
    approval_status: 'pending',
    approved_by: undefined,
    approved_at: undefined,
    rejection_reason: undefined,
    sent_at: undefined,
    sent_to: [],
    delivery_method: undefined,
    template_id: undefined,
    custom_fields: {},
    notes: 'Test invoice for approval',
    footer_text: 'Thank you for your business',
    created_by: 'test-user-id',
    created_at: new Date('2024-02-15T10:00:00Z'),
    updated_at: new Date('2024-02-15T10:00:00Z')
  };

  const mockWorkflowExecution: WorkflowExecution = {
    id: 'test-execution-id',
    invoice_id: 'test-invoice-id',
    workflow_id: 'test-workflow-id',
    current_step: 1,
    status: 'pending',
    started_at: new Date('2024-02-15T10:00:00Z'),
    completed_at: undefined,
    steps: [
      {
        step_order: 1,
        status: 'pending',
        approver_id: undefined,
        approved_at: undefined,
        comments: undefined,
        auto_approved: false
      }
    ]
  };

  const mockWorkflow = {
    id: 'test-workflow-id',
    name: 'Standard Approval Workflow',
    description: 'Standard approval process for invoices',
    approval_steps: [
      {
        step_order: 1,
        approver_role: 'manager',
        required: true,
        auto_approve_conditions: {}
      }
    ],
    auto_approve_threshold: 1000.00,
    is_active: true,
    is_default: true
  };

  describe('InvoiceApprovalInterface Component', () => {
    it('should render invoice details correctly', () => {
      const mockOnApproval = jest.fn();
      const mockOnReject = jest.fn();

      render(
        <InvoiceApprovalInterface
          invoice={mockInvoice}
          workflowExecution={mockWorkflowExecution}
          workflow={mockWorkflow}
          canApprove={true}
          onApproval={mockOnApproval}
          onReject={mockOnReject}
        />
      );

      // Check if invoice details are displayed
      expect(screen.getByText('Invoice INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText('R$ 5.500,00')).toBeInTheDocument();
      expect(screen.getByText('Solar Panel Installation')).toBeInTheDocument();
    });

    it('should show approval actions when user can approve', () => {
      const mockOnApproval = jest.fn();
      const mockOnReject = jest.fn();

      render(
        <InvoiceApprovalInterface
          invoice={mockInvoice}
          workflowExecution={mockWorkflowExecution}
          workflow={mockWorkflow}
          canApprove={true}
          onApproval={mockOnApproval}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Approve Invoice')).toBeInTheDocument();
      expect(screen.getByText('Reject Invoice')).toBeInTheDocument();
    });

    it('should handle approval action', async () => {
      const mockOnApproval = jest.fn().mockResolvedValue(undefined);
      const mockOnReject = jest.fn();

      render(
        <InvoiceApprovalInterface
          invoice={mockInvoice}
          workflowExecution={mockWorkflowExecution}
          workflow={mockWorkflow}
          canApprove={true}
          onApproval={mockOnApproval}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByText('Approve Invoice');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockOnApproval).toHaveBeenCalledWith({
          invoice_id: 'test-invoice-id',
          action: 'approve',
          comments: undefined
        });
      });
    });

    it('should require comments for rejection', async () => {
      const mockOnApproval = jest.fn();
      const mockOnReject = jest.fn();

      render(
        <InvoiceApprovalInterface
          invoice={mockInvoice}
          workflowExecution={mockWorkflowExecution}
          workflow={mockWorkflow}
          canApprove={true}
          onApproval={mockOnApproval}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByText('Reject Invoice');
      fireEvent.click(rejectButton);

      // Should show error message about required comments
      await waitFor(() => {
        expect(screen.getByText('Please provide a reason for rejection')).toBeInTheDocument();
      });

      expect(mockOnReject).not.toHaveBeenCalled();
    });

    it('should show workflow progress', () => {
      render(
        <InvoiceApprovalInterface
          invoice={mockInvoice}
          workflowExecution={mockWorkflowExecution}
          workflow={mockWorkflow}
          canApprove={true}
          onApproval={jest.fn()}
          onReject={jest.fn()}
        />
      );

      expect(screen.getByText('Approval Workflow')).toBeInTheDocument();
      expect(screen.getByText('Standard Approval Workflow')).toBeInTheDocument();
      expect(screen.getByText('Current Step')).toBeInTheDocument();
    });
  });

  describe('ApprovalWorkflowManager Component', () => {
    it('should render workflow list', () => {
      const mockWorkflows = [mockWorkflow];
      const mockOnCreate = jest.fn();
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <ApprovalWorkflowManager
          workflows={mockWorkflows}
          onCreateWorkflow={mockOnCreate}
          onUpdateWorkflow={mockOnUpdate}
          onDeleteWorkflow={mockOnDelete}
        />
      );

      expect(screen.getByText('Approval Workflows')).toBeInTheDocument();
      expect(screen.getByText('Standard Approval Workflow')).toBeInTheDocument();
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
    });

    it('should show empty state when no workflows exist', () => {
      const mockOnCreate = jest.fn();
      const mockOnUpdate = jest.fn();
      const mockOnDelete = jest.fn();

      render(
        <ApprovalWorkflowManager
          workflows={[]}
          onCreateWorkflow={mockOnCreate}
          onUpdateWorkflow={mockOnUpdate}
          onDeleteWorkflow={mockOnDelete}
        />
      );

      expect(screen.getByText('No workflows configured')).toBeInTheDocument();
      expect(screen.getByText('Create First Workflow')).toBeInTheDocument();
    });
  });

  describe('PendingApprovalsWidget Component', () => {
    const mockPendingApprovals = [
      {
        execution: mockWorkflowExecution,
        invoice: mockInvoice,
        workflow: mockWorkflow
      }
    ];

    it('should render pending approvals', () => {
      const mockOnRefresh = jest.fn();
      const mockOnApprove = jest.fn();

      render(
        <PendingApprovalsWidget
          pendingApprovals={mockPendingApprovals}
          onRefresh={mockOnRefresh}
          onApprove={mockOnApprove}
        />
      );

      expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
      expect(screen.getByText('1 invoice awaiting your approval')).toBeInTheDocument();
      expect(screen.getByText('Invoice INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });

    it('should show empty state when no pending approvals', () => {
      const mockOnRefresh = jest.fn();
      const mockOnApprove = jest.fn();

      render(
        <PendingApprovalsWidget
          pendingApprovals={[]}
          onRefresh={mockOnRefresh}
          onApprove={mockOnApprove}
        />
      );

      expect(screen.getByText('All caught up!')).toBeInTheDocument();
      expect(screen.getByText('You have no pending invoice approvals at the moment.')).toBeInTheDocument();
    });

    it('should handle refresh action', async () => {
      const mockOnRefresh = jest.fn().mockResolvedValue(undefined);
      const mockOnApprove = jest.fn();

      render(
        <PendingApprovalsWidget
          pendingApprovals={mockPendingApprovals}
          onRefresh={mockOnRefresh}
          onApprove={mockOnApprove}
        />
      );

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('should show priority indicators', () => {
      // Create overdue approval (7+ days)
      const overdueExecution = {
        ...mockWorkflowExecution,
        started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      };

      const overduePendingApprovals = [
        {
          execution: overdueExecution,
          invoice: mockInvoice,
          workflow: mockWorkflow
        }
      ];

      const mockOnRefresh = jest.fn();
      const mockOnApprove = jest.fn();

      render(
        <PendingApprovalsWidget
          pendingApprovals={overduePendingApprovals}
          onRefresh={mockOnRefresh}
          onApprove={mockOnApprove}
        />
      );

      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('should validate invoice approval request structure', () => {
      const approvalRequest: InvoiceApprovalRequest = {
        invoice_id: 'test-invoice-id',
        action: 'approve',
        comments: 'Approved for processing',
        conditions_met: { amount_check: true }
      };

      expect(approvalRequest.invoice_id).toBeDefined();
      expect(approvalRequest.action).toBe('approve');
      expect(approvalRequest.comments).toBeDefined();
      expect(typeof approvalRequest.conditions_met).toBe('object');
    });

    it('should validate workflow execution structure', () => {
      expect(mockWorkflowExecution.id).toBeDefined();
      expect(mockWorkflowExecution.invoice_id).toBeDefined();
      expect(mockWorkflowExecution.workflow_id).toBeDefined();
      expect(mockWorkflowExecution.current_step).toBeGreaterThan(0);
      expect(['pending', 'approved', 'rejected', 'cancelled']).toContain(mockWorkflowExecution.status);
      expect(Array.isArray(mockWorkflowExecution.steps)).toBe(true);
    });

    it('should validate workflow structure', () => {
      expect(mockWorkflow.id).toBeDefined();
      expect(mockWorkflow.name).toBeDefined();
      expect(Array.isArray(mockWorkflow.approval_steps)).toBe(true);
      expect(mockWorkflow.approval_steps.length).toBeGreaterThan(0);
      expect(typeof mockWorkflow.is_active).toBe('boolean');
      expect(typeof mockWorkflow.is_default).toBe('boolean');
    });
  });

  describe('Currency and Date Formatting', () => {
    it('should format currency correctly', () => {
      const mockOnApproval = jest.fn();
      const mockOnReject = jest.fn();

      render(
        <InvoiceApprovalInterface
          invoice={mockInvoice}
          workflowExecution={mockWorkflowExecution}
          workflow={mockWorkflow}
          canApprove={true}
          onApproval={mockOnApproval}
          onReject={mockOnReject}
        />
      );

      // Check Brazilian currency formatting
      expect(screen.getByText('R$ 5.500,00')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      const mockOnApproval = jest.fn();
      const mockOnReject = jest.fn();

      render(
        <InvoiceApprovalInterface
          invoice={mockInvoice}
          workflowExecution={mockWorkflowExecution}
          workflow={mockWorkflow}
          canApprove={true}
          onApproval={mockOnApproval}
          onReject={mockOnReject}
        />
      );

      // Check Brazilian date formatting
      expect(screen.getByText('15 de março de 2024')).toBeInTheDocument();
    });
  });
});
/**
 * Enhanced Input Component Unit Tests
 * Tests all features including focus states, validation feedback, floating labels, and disabled states
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { Mail, Search } from 'lucide-react';

describe('Enhanced Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Input placeholder="Test input" />);
      const input = screen.getByPlaceholderText('Test input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('border-neutral-200');
    });

    it('renders with custom className', () => {
      render(<Input className="custom-class" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} placeholder="Test" />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(<Input size="sm" placeholder="Small input" />);
      const input = screen.getByPlaceholderText('Small input');
      expect(input).toHaveClass('h-9', 'px-3', 'py-2', 'text-sm');
    });

    it('renders default size correctly', () => {
      render(<Input placeholder="Default input" />);
      const input = screen.getByPlaceholderText('Default input');
      expect(input).toHaveClass('h-11', 'px-4', 'py-3', 'text-base');
    });

    it('renders large size correctly', () => {
      render(<Input size="lg" placeholder="Large input" />);
      const input = screen.getByPlaceholderText('Large input');
      expect(input).toHaveClass('h-12', 'px-5', 'py-3', 'text-lg');
    });
  });

  describe('Focus States - Requirement 5.1', () => {
    it('applies focus styles when focused', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Focus test" />);
      const input = screen.getByPlaceholderText('Focus test');
      
      await user.click(input);
      
      expect(input).toHaveClass(
        'focus-visible:border-solar-500',
        'focus-visible:ring-4',
        'focus-visible:ring-solar-500/10'
      );
    });

    it('applies hover styles on hover', () => {
      render(<Input placeholder="Hover test" />);
      const input = screen.getByPlaceholderText('Hover test');
      
      expect(input).toHaveClass('hover:border-neutral-300');
    });

    it('has smooth transition animations', () => {
      render(<Input placeholder="Transition test" />);
      const input = screen.getByPlaceholderText('Transition test');
      
      expect(input).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Error and Success States - Requirement 5.2', () => {
    it('displays error state correctly', () => {
      render(<Input error="This field is required" placeholder="Error test" />);
      
      const input = screen.getByPlaceholderText('Error test');
      const errorMessage = screen.getByText('This field is required');
      
      expect(input).toHaveClass('border-red-500', 'bg-red-50/50');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('displays success state correctly', () => {
      render(<Input success="Looks good!" placeholder="Success test" />);
      
      const input = screen.getByPlaceholderText('Success test');
      const successMessage = screen.getByText('Looks good!');
      
      expect(input).toHaveClass('border-energy-500', 'bg-energy-50/50');
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveClass('text-energy-600');
    });

    it('prioritizes error over success state', () => {
      render(
        <Input 
          error="Error message" 
          success="Success message" 
          placeholder="Priority test" 
        />
      );
      
      const input = screen.getByPlaceholderText('Priority test');
      const errorMessage = screen.getByText('Error message');
      
      expect(input).toHaveClass('border-red-500');
      expect(errorMessage).toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    it('displays helper text when no error or success', () => {
      render(<Input helperText="This is helpful" placeholder="Helper test" />);
      
      const helperText = screen.getByText('This is helpful');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('text-neutral-500');
    });
  });

  describe('Floating Label Support - Requirement 5.3', () => {
    it('renders floating label correctly when inactive', () => {
      render(<Input floatingLabel label="Floating Label" />);
      
      const label = screen.getByText('Floating Label');
      expect(label).toHaveClass('top-1/2', '-translate-y-1/2', 'text-base', 'text-neutral-400');
    });

    it('animates floating label when focused', async () => {
      const user = userEvent.setup();
      render(<Input floatingLabel label="Floating Label" />);
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Floating Label');
      
      await user.click(input);
      
      expect(label).toHaveClass('top-2', 'text-xs', 'text-solar-600', 'font-medium');
    });

    it('keeps floating label active when input has value', () => {
      render(<Input floatingLabel label="Floating Label" value="Some value" readOnly />);
      
      const label = screen.getByText('Floating Label');
      expect(label).toHaveClass('top-2', 'text-xs', 'text-solar-600');
    });

    it('adjusts padding when floating label is active', async () => {
      const user = userEvent.setup();
      render(<Input floatingLabel label="Floating Label" />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(input).toHaveClass('pt-6', 'pb-2');
    });

    it('renders traditional label when not using floating label', () => {
      render(<Input label="Traditional Label" placeholder="Test" />);
      
      const label = screen.getByText('Traditional Label');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-neutral-700');
    });
  });

  describe('Disabled State Styling - Requirement 5.4', () => {
    it('applies disabled styles correctly', () => {
      render(<Input disabled placeholder="Disabled input" />);
      
      const input = screen.getByPlaceholderText('Disabled input');
      expect(input).toBeDisabled();
      expect(input).toHaveClass(
        'disabled:cursor-not-allowed',
        'disabled:bg-neutral-50',
        'disabled:text-neutral-400'
      );
    });

    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input disabled onChange={handleChange} placeholder="Disabled" />);
      
      const input = screen.getByPlaceholderText('Disabled');
      await user.type(input, 'test');
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Icon Support', () => {
    it('renders left icon correctly', () => {
      render(<Input icon={<Mail data-testid="mail-icon" />} placeholder="With icon" />);
      
      const input = screen.getByPlaceholderText('With icon');
      const icon = screen.getByTestId('mail-icon');
      
      expect(icon).toBeInTheDocument();
      expect(input).toHaveClass('pl-10');
    });

    it('renders right icon correctly', () => {
      render(<Input rightIcon={<Search data-testid="search-icon" />} placeholder="With right icon" />);
      
      const input = screen.getByPlaceholderText('With right icon');
      const icon = screen.getByTestId('search-icon');
      
      expect(icon).toBeInTheDocument();
      expect(input).toHaveClass('pr-10');
    });

    it('adjusts floating label position when left icon is present', () => {
      render(
        <Input 
          floatingLabel 
          label="With Icon" 
          icon={<Mail />} 
          value="test"
          readOnly
        />
      );
      
      const label = screen.getByText('With Icon');
      expect(label).toHaveClass('left-10');
    });
  });

  describe('Event Handling', () => {
    it('calls onChange when input value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} placeholder="Change test" />);
      
      const input = screen.getByPlaceholderText('Change test');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when input is focused', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      
      render(<Input onFocus={handleFocus} placeholder="Focus test" />);
      
      const input = screen.getByPlaceholderText('Focus test');
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('calls onBlur when input loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = jest.fn();
      
      render(<Input onBlur={handleBlur} placeholder="Blur test" />);
      
      const input = screen.getByPlaceholderText('Blur test');
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Input 
          label="Accessible Input" 
          error="Error message"
          aria-describedby="custom-description"
        />
      );
      
      const input = screen.getByLabelText('Accessible Input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('associates error message with input', () => {
      render(<Input label="Test Input" error="Error message" />);
      
      const input = screen.getByLabelText('Test Input');
      const errorMessage = screen.getByText('Error message');
      
      expect(input).toBeInTheDocument();
      expect(errorMessage).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Keyboard test" />);
      
      const input = screen.getByPlaceholderText('Keyboard test');
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.keyboard('test');
      expect(input).toHaveValue('test');
    });
  });

  describe('Input Types', () => {
    it('supports email type', () => {
      render(<Input type="email" placeholder="Email input" />);
      
      const input = screen.getByPlaceholderText('Email input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('supports password type', () => {
      render(<Input type="password" placeholder="Password input" />);
      
      const input = screen.getByPlaceholderText('Password input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('supports tel type', () => {
      render(<Input type="tel" placeholder="Phone input" />);
      
      const input = screen.getByPlaceholderText('Phone input');
      expect(input).toHaveAttribute('type', 'tel');
    });
  });

  describe('Value Management', () => {
    it('updates hasValue state when value changes', async () => {
      const user = userEvent.setup();
      render(<Input floatingLabel label="Test Label" />);
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');
      
      // Initially inactive
      expect(label).toHaveClass('top-1/2', '-translate-y-1/2');
      
      // Type value
      await user.type(input, 'test');
      
      // Should remain active after blur
      await user.tab();
      expect(label).toHaveClass('top-2', 'text-xs');
    });

    it('handles controlled input correctly', () => {
      const { rerender } = render(<Input value="initial" readOnly />);
      
      const input = screen.getByDisplayValue('initial');
      expect(input).toHaveValue('initial');
      
      rerender(<Input value="updated" readOnly />);
      expect(input).toHaveValue('updated');
    });
  });
});
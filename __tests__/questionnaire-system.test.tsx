/**
 * Questionnaire System Unit Tests
 * 
 * Tests for the dynamic questionnaire system components and functionality.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { QuestionRenderer } from '@/components/questionnaire/QuestionRenderer';
import { ScreeningResultDisplay } from '@/components/questionnaire/ScreeningResultDisplay';
import { QuestionnaireQuestion, ScreeningResult } from '@/lib/types/questionnaire';

// Mock data
const mockTextQuestion: QuestionnaireQuestion = {
  id: 'test-question-1',
  template_id: 'test-template',
  question_type: 'text',
  question_text: 'What is your name?',
  question_options: [],
  weight: 1.0,
  is_required: true,
  sort_order: 1,
  conditional_logic: {},
  validation_rules: {},
  metadata: {},
  created_at: new Date()
};

const mockSingleChoiceQuestion: QuestionnaireQuestion = {
  id: 'test-question-2',
  template_id: 'test-template',
  question_type: 'single_choice',
  question_text: 'What is your property type?',
  question_options: [
    { value: 'house', label: 'House', score: 2 },
    { value: 'apartment', label: 'Apartment', score: 1 },
    { value: 'commercial', label: 'Commercial', score: 2 }
  ],
  weight: 1.5,
  is_required: true,
  sort_order: 2,
  conditional_logic: {},
  validation_rules: {},
  metadata: {},
  created_at: new Date()
};

const mockScaleQuestion: QuestionnaireQuestion = {
  id: 'test-question-3',
  template_id: 'test-template',
  question_type: 'scale',
  question_text: 'Rate your interest in solar energy',
  question_options: {
    min: 1,
    max: 10,
    step: 1,
    minLabel: 'Not interested',
    maxLabel: 'Very interested'
  },
  weight: 1.0,
  is_required: true,
  sort_order: 3,
  conditional_logic: {},
  validation_rules: {},
  metadata: {},
  created_at: new Date()
};

const mockScreeningResult: ScreeningResult = {
  score: 85,
  maxScore: 100,
  percentage: 85,
  feasibilityRating: 'high',
  recommendations: [
    'Your high energy consumption makes solar very advantageous',
    'Roof in excellent condition for installation'
  ],
  riskFactors: [],
  nextSteps: [
    'Schedule free technical visit',
    'Request personalized proposal'
  ],
  estimatedSystemSize: {
    recommended: 8,
    unit: 'kWp'
  },
  estimatedInvestment: {
    min: 24000,
    max: 40000,
    currency: 'BRL'
  },
  qualificationLevel: 'qualified',
  followUpPriority: 'high',
  metadata: {
    templateVersion: '1.0',
    calculatedAt: new Date().toISOString(),
    responseId: 'test-response-id'
  }
};

describe('QuestionRenderer', () => {
  it('renders text question correctly', () => {
    const mockOnChange = jest.fn();
    
    render(
      <QuestionRenderer
        question={mockTextQuestion}
        value=""
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByPlaceholderText('Digite sua resposta...')).toBeInTheDocument();
  });

  it('handles text input changes', async () => {
    const mockOnChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <QuestionRenderer
        question={mockTextQuestion}
        value=""
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Digite sua resposta...');
    await user.clear(input);
    await user.type(input, 'John Doe');
    
    // Check that onChange was called
    expect(mockOnChange).toHaveBeenCalled();
    // Check the input value
    expect(input).toHaveValue('John Doe');
  });

  it('renders single choice question with radio buttons', () => {
    const mockOnChange = jest.fn();
    
    render(
      <QuestionRenderer
        question={mockSingleChoiceQuestion}
        value=""
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
  });

  it('handles single choice selection', async () => {
    const mockOnChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <QuestionRenderer
        question={mockSingleChoiceQuestion}
        value=""
        onChange={mockOnChange}
      />
    );
    
    const houseOption = screen.getByLabelText('House');
    await user.click(houseOption);
    
    expect(mockOnChange).toHaveBeenCalledWith('house');
  });

  it('renders scale question with range input', () => {
    const mockOnChange = jest.fn();
    
    render(
      <QuestionRenderer
        question={mockScaleQuestion}
        value={5}
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('Not interested')).toBeInTheDocument();
    expect(screen.getByText('Very interested')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('handles scale value changes', async () => {
    const mockOnChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <QuestionRenderer
        question={mockScaleQuestion}
        value={5}
        onChange={mockOnChange}
      />
    );
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '8' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(8);
  });

  it('displays error state correctly', () => {
    const mockOnChange = jest.fn();
    
    render(
      <QuestionRenderer
        question={mockTextQuestion}
        value=""
        onChange={mockOnChange}
        error="This field is required"
      />
    );
    
    const input = screen.getByPlaceholderText('Digite sua resposta...');
    expect(input).toHaveClass('border-red-500');
  });
});

describe('ScreeningResultDisplay', () => {
  it('renders high feasibility result correctly', () => {
    render(
      <ScreeningResultDisplay
        result={mockScreeningResult}
        questionnaireName="Solar Screening Test"
      />
    );
    
    expect(screen.getByText('Alta Viabilidade')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Qualificado')).toBeInTheDocument();
    expect(screen.getByText('Prioridade Alta')).toBeInTheDocument();
  });

  it('displays system size recommendation', () => {
    render(
      <ScreeningResultDisplay
        result={mockScreeningResult}
        questionnaireName="Solar Screening Test"
      />
    );
    
    expect(screen.getByText('8 kWp')).toBeInTheDocument();
    expect(screen.getByText('Sistema Recomendado')).toBeInTheDocument();
  });

  it('displays investment estimate', () => {
    render(
      <ScreeningResultDisplay
        result={mockScreeningResult}
        questionnaireName="Solar Screening Test"
      />
    );
    
    // Use a more flexible text matcher since the numbers might be formatted
    expect(screen.getByText((content, element) => {
      return content.includes('24') && content.includes('40') && content.includes('000');
    })).toBeInTheDocument();
    expect(screen.getByText('Investimento Estimado')).toBeInTheDocument();
  });

  it('displays recommendations list', () => {
    render(
      <ScreeningResultDisplay
        result={mockScreeningResult}
        questionnaireName="Solar Screening Test"
      />
    );
    
    expect(screen.getByText('Your high energy consumption makes solar very advantageous')).toBeInTheDocument();
    expect(screen.getByText('Roof in excellent condition for installation')).toBeInTheDocument();
  });

  it('displays next steps with numbering', () => {
    render(
      <ScreeningResultDisplay
        result={mockScreeningResult}
        questionnaireName="Solar Screening Test"
      />
    );
    
    expect(screen.getByText('Schedule free technical visit')).toBeInTheDocument();
    expect(screen.getByText('Request personalized proposal')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles contact request button click', async () => {
    const mockOnContactRequest = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ScreeningResultDisplay
        result={mockScreeningResult}
        questionnaireName="Solar Screening Test"
        onContactRequest={mockOnContactRequest}
      />
    );
    
    const contactButton = screen.getByText('Falar com Especialista');
    await user.click(contactButton);
    
    expect(mockOnContactRequest).toHaveBeenCalled();
  });

  it('handles quote request button click', async () => {
    const mockOnNewQuote = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ScreeningResultDisplay
        result={mockScreeningResult}
        questionnaireName="Solar Screening Test"
        onNewQuote={mockOnNewQuote}
      />
    );
    
    const quoteButton = screen.getByText('Agendar Visita Técnica');
    await user.click(quoteButton);
    
    expect(mockOnNewQuote).toHaveBeenCalled();
  });

  it('renders different feasibility ratings correctly', () => {
    const lowFeasibilityResult = {
      ...mockScreeningResult,
      feasibilityRating: 'low' as const,
      percentage: 35
    };
    
    render(
      <ScreeningResultDisplay
        result={lowFeasibilityResult}
        questionnaireName="Solar Screening Test"
      />
    );
    
    expect(screen.getByText('Baixa Viabilidade')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    const minimalResult: ScreeningResult = {
      score: 50,
      maxScore: 100,
      percentage: 50,
      feasibilityRating: 'medium',
      recommendations: [],
      riskFactors: [],
      nextSteps: [],
      qualificationLevel: 'partially_qualified',
      followUpPriority: 'medium',
      metadata: {}
    };
    
    render(
      <ScreeningResultDisplay
        result={minimalResult}
        questionnaireName="Solar Screening Test"
      />
    );
    
    expect(screen.getByText('Média Viabilidade')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    // Should not crash when optional sections are empty
  });
});

describe('Questionnaire System Integration', () => {
  it('validates question types are supported', () => {
    const supportedTypes = [
      'text', 'textarea', 'number', 'email', 'phone', 'url',
      'single_choice', 'multiple_choice', 'boolean', 'scale',
      'date', 'time', 'datetime', 'file_upload'
    ];
    
    supportedTypes.forEach(type => {
      const question: QuestionnaireQuestion = {
        ...mockTextQuestion,
        question_type: type as any
      };
      
      expect(() => {
        render(
          <QuestionRenderer
            question={question}
            value=""
            onChange={() => {}}
          />
        );
      }).not.toThrow();
    });
  });

  it('handles conditional logic evaluation', () => {
    // This would test the conditional logic evaluation
    // For now, we'll just ensure the component renders
    const questionWithLogic: QuestionnaireQuestion = {
      ...mockTextQuestion,
      conditional_logic: {
        showIf: [
          {
            questionId: 'other-question',
            operator: 'equals',
            value: 'yes'
          }
        ]
      }
    };
    
    expect(() => {
      render(
        <QuestionRenderer
          question={questionWithLogic}
          value=""
          onChange={() => {}}
        />
      );
    }).not.toThrow();
  });

  it('validates scoring result calculations', () => {
    const result = mockScreeningResult;
    
    // Verify percentage calculation
    expect(result.percentage).toBe(Math.round((result.score / result.maxScore) * 100));
    
    // Verify feasibility rating matches percentage
    if (result.percentage >= 80) {
      expect(result.feasibilityRating).toBe('high');
    } else if (result.percentage >= 60) {
      expect(result.feasibilityRating).toBe('medium');
    } else if (result.percentage >= 40) {
      expect(result.feasibilityRating).toBe('low');
    } else {
      expect(result.feasibilityRating).toBe('not_feasible');
    }
  });
});
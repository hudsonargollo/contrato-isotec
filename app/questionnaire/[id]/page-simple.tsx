/**
 * Simple Questionnaire Page
 * 
 * Simplified version for testing without complex dependencies.
 */

import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
}

// Fetch questionnaire data on server side
async function getQuestionnaire(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/questionnaires/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const questionnaire = await getQuestionnaire(id);
  
  if (!questionnaire) {
    return {
      title: 'Questionário não encontrado',
      description: 'O questionário solicitado não foi encontrado.'
    };
  }
  
  return {
    title: `${questionnaire.name} | Avaliação Solar`,
    description: questionnaire.description || 'Complete nossa avaliação para descobrir o potencial solar da sua propriedade.'
  };
}

export default async function QuestionnairePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const questionnaire = await getQuestionnaire(id);
  
  if (!questionnaire) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">
            {questionnaire.name}
          </h1>
          {questionnaire.description && (
            <p className="text-lg text-neutral-600 mb-6">
              {questionnaire.description}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-4 py-2 text-sm font-medium">
              <span>✅</span>
              <span>Sistema funcionando!</span>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Questões disponíveis:</h3>
            <div className="space-y-2">
              {questionnaire.questions.map((question, index) => (
                <div key={question.id} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {question.question_text}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Tipo: {question.question_type} | Obrigatória: {question.is_required ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-neutral-500">
              O questionário completo será implementado em breve.
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              ID da sessão: {id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
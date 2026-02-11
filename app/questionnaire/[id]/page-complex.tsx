/**
 * Public Questionnaire Page
 * 
 * Public-facing page for questionnaire completion.
 * Accessible without authentication for marketing funnels.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QuestionnaireClient } from './QuestionnaireClient';

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
      cache: 'no-store' // Always fetch fresh data
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
    description: questionnaire.description || 'Complete nossa avaliação para descobrir o potencial solar da sua propriedade.',
    openGraph: {
      title: questionnaire.name,
      description: questionnaire.description || 'Avaliação gratuita de viabilidade solar',
      type: 'website',
      images: [
        {
          url: '/isotec-logo.webp',
          width: 1200,
          height: 630,
          alt: 'ISOTEC - Energia Solar'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: questionnaire.name,
      description: questionnaire.description || 'Avaliação gratuita de viabilidade solar'
    }
  };
}

export default async function QuestionnairePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { utm_source, utm_medium, utm_campaign } = await searchParams;
  
  const questionnaire = await getQuestionnaire(id);
  
  if (!questionnaire) {
    notFound();
  }
  
  return (
    <QuestionnaireClient 
      questionnaire={questionnaire}
      utmParams={{
        source: utm_source,
        medium: utm_medium,
        campaign: utm_campaign
      }}
    />
  );
}
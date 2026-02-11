'use client';

/**
 * Questionnaire Client Component
 * 
 * Client-side wrapper for the questionnaire renderer.
 * Handles session management and UTM tracking.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2 } from 'lucide-react';

import { PublicQuestionnaire, ScreeningResult, QuestionnaireProgress } from '@/lib/types/questionnaire';
import { QuestionnaireRenderer } from '@/components/questionnaire/QuestionnaireRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QuestionnaireClientProps {
  questionnaire: PublicQuestionnaire;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export function QuestionnaireClient({ questionnaire, utmParams }: QuestionnaireClientProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const [progress, setProgress] = useState<QuestionnaireProgress | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Generate session ID on mount
  useEffect(() => {
    const generateSessionId = () => {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };
    
    setSessionId(generateSessionId());
  }, []);

  // Handle questionnaire completion
  const handleComplete = (result: ScreeningResult) => {
    setIsCompleted(true);
    
    // Track completion event (would integrate with analytics)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'questionnaire_completed', {
        questionnaire_id: questionnaire.id,
        questionnaire_name: questionnaire.name,
        feasibility_rating: result.feasibilityRating,
        qualification_level: result.qualificationLevel,
        score_percentage: result.percentage,
        utm_source: utmParams?.source,
        utm_medium: utmParams?.medium,
        utm_campaign: utmParams?.campaign
      });
    }
  };

  // Handle progress updates
  const handleProgress = (newProgress: QuestionnaireProgress) => {
    setProgress(newProgress);
    
    // Track progress milestones
    if (typeof window !== 'undefined' && window.gtag) {
      const milestones = [25, 50, 75];
      const currentMilestone = milestones.find(m => 
        newProgress.percentComplete >= m && 
        (!progress || progress.percentComplete < m)
      );
      
      if (currentMilestone) {
        window.gtag('event', 'questionnaire_progress', {
          questionnaire_id: questionnaire.id,
          progress_percentage: currentMilestone,
          utm_source: utmParams?.source,
          utm_medium: utmParams?.medium,
          utm_campaign: utmParams?.campaign
        });
      }
    }
  };

  // Handle contact request
  const handleContactRequest = () => {
    // Would integrate with CRM or contact form
    if (typeof window !== 'undefined') {
      window.open('tel:+5511999999999', '_self');
    }
  };

  // Handle quote request
  const handleQuoteRequest = () => {
    // Would integrate with scheduling system
    if (typeof window !== 'undefined') {
      window.open('https://calendly.com/isotec-solar', '_blank');
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: questionnaire.name,
          text: questionnaire.description || 'Descubra o potencial solar da sua propriedade',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // Would show toast notification
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-neutral-500">
              Carregando...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Image
                src="/isotec-logo.webp"
                alt="ISOTEC"
                width={100}
                height={40}
                priority
                className="h-8 w-auto"
              />
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-white hover:bg-white/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Introduction */}
          {!isCompleted && (
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {questionnaire.name}
              </h1>
              {questionnaire.description && (
                <p className="text-lg text-neutral-300 mb-6 max-w-2xl mx-auto">
                  {questionnaire.description}
                </p>
              )}
              
              {/* Estimated duration */}
              {questionnaire.metadata?.estimated_duration && (
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
                  <span>⏱️</span>
                  <span>Tempo estimado: {questionnaire.metadata.estimated_duration}</span>
                </div>
              )}
            </div>
          )}

          {/* Questionnaire */}
          <QuestionnaireRenderer
            questionnaire={questionnaire}
            sessionId={sessionId}
            onComplete={handleComplete}
            onProgress={handleProgress}
            className="bg-white rounded-xl shadow-2xl overflow-hidden"
          />

          {/* Footer */}
          {!isCompleted && (
            <div className="text-center mt-8 text-sm text-neutral-400">
              <p>
                Suas informações são seguras e não serão compartilhadas com terceiros.
              </p>
              <p className="mt-2">
                Dúvidas? Entre em contato: 
                <a 
                  href="tel:+5511999999999" 
                  className="text-solar-400 hover:text-solar-300 ml-1"
                >
                  (11) 99999-9999
                </a>
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* UTM Tracking Script */}
      {utmParams && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'questionnaire_started', {
                  questionnaire_id: '${questionnaire.id}',
                  questionnaire_name: '${questionnaire.name}',
                  utm_source: '${utmParams.source || ''}',
                  utm_medium: '${utmParams.medium || ''}',
                  utm_campaign: '${utmParams.campaign || ''}'
                });
              }
            `
          }}
        />
      )}
    </div>
  );
}
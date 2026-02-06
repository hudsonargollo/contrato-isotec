/**
 * Form Data Persistence Utility
 * 
 * Utilities for caching form data to prevent loss during network errors
 * and providing recovery options for users.
 * 
 * Validates: Requirements 9.3
 */

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';

export interface FormPersistenceOptions {
  key: string;
  debounceMs?: number;
  enableAutoSave?: boolean;
  enableRecovery?: boolean;
  maxAge?: number; // in milliseconds
  onRestore?: (data: any) => void;
  onClear?: () => void;
}

export interface PersistedFormData {
  data: any;
  timestamp: number;
  version: string;
}

const STORAGE_PREFIX = 'isotec_form_';
const CURRENT_VERSION = '1.0';

export class FormPersistence {
  private static instance: FormPersistence;
  private storage: Storage;

  private constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage);
  }

  static getInstance(): FormPersistence {
    if (!FormPersistence.instance) {
      FormPersistence.instance = new FormPersistence();
    }
    return FormPersistence.instance;
  }

  private getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  save(key: string, data: any): boolean {
    try {
      const persistedData: PersistedFormData = {
        data,
        timestamp: Date.now(),
        version: CURRENT_VERSION,
      };

      this.storage.setItem(
        this.getStorageKey(key),
        JSON.stringify(persistedData)
      );
      return true;
    } catch (error) {
      console.warn('Failed to save form data:', error);
      return false;
    }
  }

  load(key: string, maxAge?: number): any | null {
    try {
      const stored = this.storage.getItem(this.getStorageKey(key));
      if (!stored) return null;

      const persistedData: PersistedFormData = JSON.parse(stored);
      
      // Check version compatibility
      if (persistedData.version !== CURRENT_VERSION) {
        this.remove(key);
        return null;
      }

      // Check age
      if (maxAge && Date.now() - persistedData.timestamp > maxAge) {
        this.remove(key);
        return null;
      }

      return persistedData.data;
    } catch (error) {
      console.warn('Failed to load form data:', error);
      this.remove(key);
      return null;
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.warn('Failed to remove form data:', error);
    }
  }

  exists(key: string): boolean {
    try {
      return this.storage.getItem(this.getStorageKey(key)) !== null;
    } catch (error) {
      return false;
    }
  }

  getAge(key: string): number | null {
    try {
      const stored = this.storage.getItem(this.getStorageKey(key));
      if (!stored) return null;

      const persistedData: PersistedFormData = JSON.parse(stored);
      return Date.now() - persistedData.timestamp;
    } catch (error) {
      return null;
    }
  }

  listKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keys.push(key.replace(STORAGE_PREFIX, ''));
        }
      }
      return keys;
    } catch (error) {
      return [];
    }
  }

  cleanup(maxAge: number = 24 * 60 * 60 * 1000): number {
    let cleaned = 0;
    const keys = this.listKeys();
    
    keys.forEach(key => {
      const age = this.getAge(key);
      if (age && age > maxAge) {
        this.remove(key);
        cleaned++;
      }
    });

    return cleaned;
  }
}

// React hook for form persistence
export function useFormPersistence(options: FormPersistenceOptions) {
  const {
    key,
    debounceMs = 500,
    enableAutoSave = true,
    enableRecovery = true,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    onRestore,
    onClear,
  } = options;

  const toast = useToast();
  const persistence = FormPersistence.getInstance();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownRecoveryRef = useRef(false);

  // Check for existing data on mount
  useEffect(() => {
    if (!enableRecovery || hasShownRecoveryRef.current) return;

    const existingData = persistence.load(key, maxAge);
    if (existingData) {
      hasShownRecoveryRef.current = true;
      
      const age = persistence.getAge(key);
      const ageMinutes = age ? Math.floor(age / (1000 * 60)) : 0;
      
      toast.custom({
        variant: 'info',
        title: 'Dados Recuperados',
        description: `Encontramos dados salvos de ${ageMinutes} minutos atrás. Deseja restaurá-los?`,
        persistent: true,
        action: {
          label: 'Restaurar',
          onClick: () => {
            onRestore?.(existingData);
            toast.success('Dados Restaurados', 'Seus dados foram recuperados com sucesso.');
          },
        },
      });
    }
  }, [key, maxAge, enableRecovery, onRestore, toast, persistence]);

  // Save data with debouncing
  const saveData = useCallback((data: any) => {
    if (!enableAutoSave) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      const success = persistence.save(key, data);
      if (!success) {
        console.warn('Failed to save form data for key:', key);
      }
    }, debounceMs);
  }, [key, debounceMs, enableAutoSave, persistence]);

  // Load data
  const loadData = useCallback(() => {
    return persistence.load(key, maxAge);
  }, [key, maxAge, persistence]);

  // Clear data
  const clearData = useCallback(() => {
    persistence.remove(key);
    onClear?.();
  }, [key, onClear, persistence]);

  // Check if data exists
  const hasData = useCallback(() => {
    return persistence.exists(key);
  }, [key, persistence]);

  // Get data age
  const getDataAge = useCallback(() => {
    return persistence.getAge(key);
  }, [key, persistence]);

  // Manual save (immediate, no debounce)
  const saveNow = useCallback((data: any) => {
    return persistence.save(key, data);
  }, [key, persistence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveData,
    loadData,
    clearData,
    hasData,
    getDataAge,
    saveNow,
  };
}

// Utility function to create a form persistence key
export function createFormKey(formName: string, userId?: string, additionalId?: string): string {
  const parts = [formName];
  if (userId) parts.push(userId);
  if (additionalId) parts.push(additionalId);
  return parts.join('_');
}

// Utility function to format age for display
export function formatDataAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} dia${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else {
    return 'menos de 1 minuto';
  }
}

// Global cleanup function (can be called periodically)
export function cleanupOldFormData(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
  const persistence = FormPersistence.getInstance();
  return persistence.cleanup(maxAge);
}

// Recovery component for manual data recovery
export interface FormRecoveryProps {
  formKey: string;
  onRestore: (data: any) => void;
  onDismiss: () => void;
  maxAge?: number;
}

export function useFormRecovery({ formKey, onRestore, onDismiss: _onDismiss, maxAge }: FormRecoveryProps) {
  const persistence = FormPersistence.getInstance();
  const toast = useToast();

  const checkForRecovery = useCallback(() => {
    const existingData = persistence.load(formKey, maxAge);
    if (existingData) {
      const age = persistence.getAge(formKey);
      const ageText = age ? formatDataAge(age) : 'recentemente';
      
      toast.custom({
        variant: 'info',
        title: 'Dados Encontrados',
        description: `Há dados salvos de ${ageText}. Deseja recuperá-los?`,
        persistent: true,
        action: {
          label: 'Recuperar',
          onClick: () => {
            onRestore(existingData);
            persistence.remove(formKey);
            toast.success('Dados Recuperados', 'Seus dados foram restaurados.');
          },
        },
      });
    }
  }, [formKey, maxAge, onRestore, persistence, toast]);

  return { checkForRecovery };
}
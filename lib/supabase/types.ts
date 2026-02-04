/**
 * TypeScript type definitions for Supabase database schema
 * 
 * These types provide type safety for database operations
 * and match the schema defined in migrations.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          mfa_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: string
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          uuid: string
          contractor_name: string
          contractor_cpf: string
          contractor_email: string | null
          contractor_phone: string | null
          address_cep: string
          address_street: string
          address_number: string
          address_complement: string | null
          address_neighborhood: string
          address_city: string
          address_state: string
          location_latitude: number | null
          location_longitude: number | null
          project_kwp: number
          installation_date: string | null
          services: Json
          contract_value: number
          payment_method: string
          status: string
          contract_hash: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          signed_at: string | null
        }
        Insert: {
          id?: string
          uuid?: string
          contractor_name: string
          contractor_cpf: string
          contractor_email?: string | null
          contractor_phone?: string | null
          address_cep: string
          address_street: string
          address_number: string
          address_complement?: string | null
          address_neighborhood: string
          address_city: string
          address_state: string
          location_latitude?: number | null
          location_longitude?: number | null
          project_kwp: number
          installation_date?: string | null
          services?: Json
          contract_value: number
          payment_method: string
          status?: string
          contract_hash?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          signed_at?: string | null
        }
        Update: {
          id?: string
          uuid?: string
          contractor_name?: string
          contractor_cpf?: string
          contractor_email?: string | null
          contractor_phone?: string | null
          address_cep?: string
          address_street?: string
          address_number?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_city?: string
          address_state?: string
          location_latitude?: number | null
          location_longitude?: number | null
          project_kwp?: number
          installation_date?: string | null
          services?: Json
          contract_value?: number
          payment_method?: string
          status?: string
          contract_hash?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          signed_at?: string | null
        }
      }
      contract_items: {
        Row: {
          id: string
          contract_id: string
          item_name: string
          quantity: number
          unit: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          item_name: string
          quantity: number
          unit: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          item_name?: string
          quantity?: number
          unit?: string
          sort_order?: number
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          contract_id: string
          event_type: string
          signature_method: string
          contract_hash: string
          signer_identifier: string | null
          ip_address: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          event_type: string
          signature_method: string
          contract_hash: string
          signer_identifier?: string | null
          ip_address: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          event_type?: string
          signature_method?: string
          contract_hash?: string
          signer_identifier?: string | null
          ip_address?: string
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

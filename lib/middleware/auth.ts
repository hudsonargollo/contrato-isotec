/**
 * Authentication Middleware
 * Requirements: 8.1, 8.2 - User authentication and session management
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

/**
 * Require authentication for API routes
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client
    const supabase = createClient();

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Optional authentication - doesn't fail if no auth provided
 */
export async function optionalAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: true }; // No auth provided, but that's okay
    }

    return await requireAuth(request);

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    return { success: true }; // Don't fail on auth errors for optional auth
  }
}

/**
 * Get user from request without requiring authentication
 */
export async function getUser(request: NextRequest): Promise<any | null> {
  try {
    const authResult = await optionalAuth(request);
    return authResult.user || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
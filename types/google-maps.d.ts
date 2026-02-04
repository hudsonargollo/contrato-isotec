/**
 * Type declarations for Google Maps JavaScript API
 * Extends the global namespace with Google Maps types
 */

/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};

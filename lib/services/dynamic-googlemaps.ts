/**
 * Dynamic Google Maps Loading
 * Lazy loads Google Maps API to reduce initial bundle size
 */

import { Coordinates } from '@/lib/types';

// Dynamic import for Google Maps to reduce bundle size
export const loadGoogleMaps = async (): Promise<typeof import('./googlemaps')> => {
  const googleMapsModule = await import('./googlemaps');
  return googleMapsModule;
};

// Wrapper function for geocoding with dynamic loading
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  const { geocodeAddress: geocodeFn } = await loadGoogleMaps();
  return geocodeFn(address);
};

// Wrapper function for reverse geocoding with dynamic loading
export const reverseGeocode = async (coordinates: Coordinates): Promise<string | null> => {
  const { reverseGeocode: reverseGeocodeFn } = await loadGoogleMaps();
  return reverseGeocodeFn(coordinates.latitude, coordinates.longitude);
};
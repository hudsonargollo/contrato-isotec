/**
 * Google Maps JavaScript API Integration
 * Provides geocoding, reverse geocoding, and coordinate validation services
 * Requirements: 3A.1, 3A.2, 3A.7
 */

import { Loader } from '@googlemaps/js-api-loader';
import { Coordinates } from '@/lib/types';

/**
 * Brazil's geographic boundaries for coordinate validation
 * Latitude: -33.75 (south) to 5.27 (north)
 * Longitude: -73.99 (west) to -34.79 (east)
 */
const BRAZIL_BOUNDS = {
  north: 5.27,
  south: -33.75,
  west: -73.99,
  east: -34.79,
};

/**
 * Default map center (São Paulo, Brazil)
 */
export const DEFAULT_MAP_CENTER: Coordinates = {
  latitude: -23.5505,
  longitude: -46.6333,
};

/**
 * Default map zoom level
 */
export const DEFAULT_MAP_ZOOM = 15;

/**
 * Google Maps API configuration
 */
export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: DEFAULT_MAP_CENTER,
  defaultZoom: DEFAULT_MAP_ZOOM,
};

/**
 * Initialize Google Maps JavaScript API loader
 */
let loaderInstance: Loader | null = null;

export function getGoogleMapsLoader(): Loader {
  if (!loaderInstance) {
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      throw new Error('Google Maps API key is not configured');
    }
    
    loaderInstance = new Loader({
      apiKey: GOOGLE_MAPS_CONFIG.apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding'],
    });
  }
  
  return loaderInstance;
}

/**
 * Validates that coordinates are within Brazil's geographic boundaries
 * Requirements: 3A.7
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns true if coordinates are within Brazil, false otherwise
 */
export function validateBrazilianCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= BRAZIL_BOUNDS.south &&
    lat <= BRAZIL_BOUNDS.north &&
    lng >= BRAZIL_BOUNDS.west &&
    lng <= BRAZIL_BOUNDS.east
  );
}

/**
 * Formats coordinates for display with 8 decimal places
 * Requirements: 3A.4, 3A.5
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns Formatted coordinate string
 */
export function formatCoordinates(lat: number, lng: number): string {
  const formattedLat = lat.toFixed(8);
  const formattedLng = lng.toFixed(8);
  return `${formattedLat}, ${formattedLng}`;
}

/**
 * Geocodes an address to coordinates using Google Maps Geocoding API
 * Requirements: 3A.2
 * 
 * @param address - Full address string to geocode
 * @returns Coordinates or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const loader = getGoogleMapsLoader();
    const { Geocoder } = await loader.importLibrary('geocoding') as google.maps.GeocodingLibrary;
    
    const geocoder = new Geocoder();
    
    const result = await geocoder.geocode({
      address: address,
      region: 'BR', // Bias results to Brazil
    });
    
    if (result.results && result.results.length > 0) {
      const location = result.results[0].geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      // Validate coordinates are within Brazil
      if (!validateBrazilianCoordinates(lat, lng)) {
        console.warn('Geocoded coordinates are outside Brazil boundaries:', { lat, lng });
        return null;
      }
      
      return {
        latitude: lat,
        longitude: lng,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocodes coordinates to an address
 * Requirements: 3A.2
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns Address string or null if reverse geocoding fails
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const loader = getGoogleMapsLoader();
    const { Geocoder } = await loader.importLibrary('geocoding') as google.maps.GeocodingLibrary;
    
    const geocoder = new Geocoder();
    
    const result = await geocoder.geocode({
      location: { lat, lng },
    });
    
    if (result.results && result.results.length > 0) {
      return result.results[0].formatted_address;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Extracts city and state from a geocoded address result
 * Used for validation in Property 28
 * 
 * @param address - Full address string
 * @returns Object with city and state, or null if extraction fails
 */
export function extractCityAndState(address: string): { city: string; state: string } | null {
  try {
    // Brazilian addresses from Google Maps typically follow formats like:
    // "Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brazil"
    // "Rua Augusta, 123, Centro - Rio de Janeiro - RJ, Brazil"
    
    // Strategy: Find the part that contains "City - State" pattern
    // State codes in Brazil are 2 uppercase letters (SP, RJ, MG, etc.)
    const statePattern = /([^,]+)\s*-\s*([A-Z]{2})(?:,|$)/;
    const match = address.match(statePattern);
    
    if (match) {
      const city = match[1].trim();
      const state = match[2].trim();
      return { city, state };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting city and state:', error);
    return null;
  }
}

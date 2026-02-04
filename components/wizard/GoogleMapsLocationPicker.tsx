'use client';

/**
 * Google Maps Location Picker Component
 * Interactive map component for capturing precise installation site coordinates
 * Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.6
 */

import { useEffect, useRef, useState } from 'react';
import { getGoogleMapsLoader, formatCoordinates, validateBrazilianCoordinates, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/services/googlemaps';
import { Coordinates } from '@/lib/types';

interface GoogleMapsLocationPickerProps {
  /**
   * Initial center coordinates for the map
   * When address is auto-filled via ViaCEP, this should be set to the geocoded location
   */
  center?: Coordinates;
  
  /**
   * Initial marker position (if coordinates already exist)
   */
  markerPosition?: Coordinates;
  
  /**
   * Callback when user places or moves the marker
   */
  onLocationChange: (coordinates: Coordinates) => void;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

export default function GoogleMapsLocationPicker({
  center,
  markerPosition,
  onLocationChange,
  className = '',
}: GoogleMapsLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(
    markerPosition || null
  );

  /**
   * Initialize Google Maps
   */
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        setIsLoading(true);
        setError(null);

        const loader = getGoogleMapsLoader();
        const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
        const { Marker } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

        if (!mapRef.current || !isMounted) return;

        // Determine initial center
        const initialCenter = center || DEFAULT_MAP_CENTER;
        
        // Create map instance
        const map = new Map(mapRef.current, {
          center: {
            lat: initialCenter.latitude,
            lng: initialCenter.longitude,
          },
          zoom: center ? DEFAULT_MAP_ZOOM : 12, // Zoom in more if we have a specific address
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Create marker if we have an initial position
        if (markerPosition) {
          const marker = new Marker({
            position: {
              lat: markerPosition.latitude,
              lng: markerPosition.longitude,
            },
            map: map,
            draggable: true,
            title: 'Installation Site',
          });

          markerRef.current = marker;

          // Handle marker drag
          marker.addListener('dragend', () => {
            const position = marker.getPosition();
            if (position) {
              const lat = position.lat();
              const lng = position.lng();
              
              // Validate coordinates are within Brazil
              if (!validateBrazilianCoordinates(lat, lng)) {
                setError('Location must be within Brazil. Please adjust the pin.');
                return;
              }
              
              const coords: Coordinates = {
                latitude: lat,
                longitude: lng,
              };
              
              setCurrentCoordinates(coords);
              onLocationChange(coords);
              setError(null);
            }
          });
        }

        // Handle map clicks to place/move marker
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            // Validate coordinates are within Brazil
            if (!validateBrazilianCoordinates(lat, lng)) {
              setError('Location must be within Brazil. Please select a location within Brazilian territory.');
              return;
            }
            
            const coords: Coordinates = {
              latitude: lat,
              longitude: lng,
            };

            // Create or move marker
            if (markerRef.current) {
              markerRef.current.setPosition(event.latLng);
            } else {
              const marker = new Marker({
                position: event.latLng,
                map: map,
                draggable: true,
                title: 'Installation Site',
              });

              markerRef.current = marker;

              // Handle marker drag
              marker.addListener('dragend', () => {
                const position = marker.getPosition();
                if (position) {
                  const dragLat = position.lat();
                  const dragLng = position.lng();
                  
                  if (!validateBrazilianCoordinates(dragLat, dragLng)) {
                    setError('Location must be within Brazil. Please adjust the pin.');
                    return;
                  }
                  
                  const dragCoords: Coordinates = {
                    latitude: dragLat,
                    longitude: dragLng,
                  };
                  
                  setCurrentCoordinates(dragCoords);
                  onLocationChange(dragCoords);
                  setError(null);
                }
              });
            }

            setCurrentCoordinates(coords);
            onLocationChange(coords);
            setError(null);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        if (isMounted) {
          setError('Map service unavailable. Location pin is optional.');
          setIsLoading(false);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  /**
   * Update map center when center prop changes (e.g., after address auto-fill)
   */
  useEffect(() => {
    if (center && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: center.latitude,
        lng: center.longitude,
      });
      mapInstanceRef.current.setZoom(DEFAULT_MAP_ZOOM);
    }
  }, [center]);

  return (
    <div className={className}>
      <div className="space-y-2">
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-[400px] rounded-lg border border-gray-700 bg-gray-900"
          style={{ minHeight: '400px' }}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4 text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2" />
            Loading map...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Coordinates Display */}
        {currentCoordinates && !error && (
          <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="text-sm text-blue-400 font-medium mb-1">
              Selected Coordinates:
            </div>
            <div className="text-xs text-gray-300 font-mono">
              {formatCoordinates(currentCoordinates.latitude, currentCoordinates.longitude)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Drag the marker or click on the map to adjust the location
            </div>
          </div>
        )}

        {/* Instructions */}
        {!currentCoordinates && !isLoading && !error && (
          <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm">
            Click on the map to place a marker at the installation site location
          </div>
        )}
      </div>
    </div>
  );
}

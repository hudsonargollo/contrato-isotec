'use client';

/**
 * Google Maps Location Picker Component
 * Interactive map component for capturing precise installation site coordinates
 * Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.6
 */

import { useEffect, useRef, useState } from 'react';
import { getGoogleMapsLoader, formatCoordinates, validateBrazilianCoordinates, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/services/googlemaps';
import { Coordinates } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle } from 'lucide-react';

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

  /**
   * Whether the address has been filled (to determine when to load the map)
   */
  addressFilled?: boolean;

  /**
   * Address string for display purposes
   */
  addressString?: string;
}

export default function GoogleMapsLocationPicker({
  center,
  markerPosition,
  onLocationChange,
  className = '',
  addressFilled = false,
  addressString,
}: GoogleMapsLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(
    markerPosition || null
  );

  // Check if Google Maps API key is available
  const hasApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  /**
   * Initialize Google Maps only when requested
   */
  const initializeMap = async () => {
    if (!hasApiKey) {
      setError('Google Maps API key not configured. Location pin is optional.');
      return;
    }

    if (mapInitialized || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Initializing Google Maps...');
      const loader = getGoogleMapsLoader();
      console.log('Loader created, importing libraries...');
      
      const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
      const { Marker } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

      console.log('Libraries loaded successfully');

      if (!mapRef.current) {
        console.log('Map ref not available');
        return;
      }

      // Determine initial center
      const initialCenter = center || DEFAULT_MAP_CENTER;
      
      console.log('Creating map with center:', initialCenter);
      
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
        zoomControl: true,
        scaleControl: true,
        rotateControl: false,
        mapTypeId: 'hybrid', // Show satellite view by default for better location identification
      });

      console.log('Map created successfully');
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
          title: 'Local de Instalação - Arraste para ajustar',
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
              title: 'Installation Site - Drag to adjust location',
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

      setMapInitialized(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing Google Maps:', err);
      setError('Map service unavailable. Location pin is optional.');
      setIsLoading(false);
    }
  };

  /**
   * Load map when user requests it
   */
  const handleLoadMap = () => {
    setShouldLoadMap(true);
    initializeMap();
  };

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

  // Auto-load map if address is filled and we have coordinates
  useEffect(() => {
    if (addressFilled && center && !mapInitialized && !shouldLoadMap) {
      setShouldLoadMap(true);
      initializeMap();
    }
  }, [addressFilled, center, mapInitialized, shouldLoadMap]);

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Map Container or Placeholder */}
        {!shouldLoadMap ? (
          <div className="w-full h-[400px] rounded-lg border-2 border-dashed border-neutral-600 bg-neutral-800/50 flex flex-col items-center justify-center text-center p-6">
            <MapPin className="w-12 h-12 text-neutral-500 mb-4" />
            <h3 className="text-lg font-medium text-neutral-300 mb-2">
              Localização no Mapa
            </h3>
            <p className="text-sm text-neutral-400 mb-4 max-w-md">
              {addressFilled 
                ? `Clique para carregar o mapa e marcar a localização exata em: ${addressString || 'endereço preenchido'}`
                : 'Preencha o endereço primeiro para carregar o mapa com a localização aproximada'
              }
            </p>
            {addressFilled && hasApiKey && (
              <Button 
                onClick={handleLoadMap}
                variant="outline"
                className="border-solar-500 text-solar-400 hover:bg-solar-500/10"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Carregar Mapa
              </Button>
            )}
            {!hasApiKey && (
              <div className="flex items-center gap-2 text-yellow-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Google Maps não configurado (opcional)</span>
              </div>
            )}
          </div>
        ) : (
          <div
            ref={mapRef}
            className="w-full h-[400px] rounded-lg border border-neutral-600 bg-neutral-900"
            style={{ minHeight: '400px' }}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4 text-neutral-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-solar-500 mr-2" />
            Carregando mapa...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Coordinates Display */}
        {currentCoordinates && !error && (
          <div className="p-3 bg-solar-900/20 border border-solar-700 rounded-lg">
            <div className="text-sm text-solar-400 font-medium mb-1">
              📍 Coordenadas Selecionadas:
            </div>
            <div className="text-xs text-neutral-300 font-mono">
              {formatCoordinates(currentCoordinates.latitude, currentCoordinates.longitude)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Arraste o marcador ou clique no mapa para ajustar a localização
            </div>
          </div>
        )}

        {/* Instructions */}
        {shouldLoadMap && mapInitialized && !currentCoordinates && !isLoading && !error && (
          <div className="p-3 bg-ocean-900/20 border border-ocean-700 rounded-lg text-ocean-400 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Como usar o mapa:</div>
                <ul className="text-xs space-y-1 text-ocean-300">
                  <li>• Clique no mapa para colocar um marcador</li>
                  <li>• Arraste o marcador para ajustar a posição</li>
                  <li>• Use os controles para navegar e alterar a visualização</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* API Key Missing Warning */}
        {!hasApiKey && shouldLoadMap && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Google Maps não configurado</div>
                <div className="text-xs text-yellow-300 mt-1">
                  A chave da API do Google Maps não foi configurada. A localização no mapa é opcional.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

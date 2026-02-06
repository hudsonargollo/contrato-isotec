/**
 * Google Maps Test Page
 * Test page for debugging Google Maps integration
 */

'use client';

import { useState } from 'react';
import GoogleMapsLocationPicker from '@/components/wizard/GoogleMapsLocationPicker';
import { Coordinates } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Client component for Google Maps testing

export default function TestMapsPage() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [addressFilled, setAddressFilled] = useState(false);
  const [testAddress, setTestAddress] = useState('');
  const [mapCenter, setMapCenter] = useState<Coordinates | undefined>(undefined);

  const handleLocationChange = (coords: Coordinates) => {
    setCoordinates(coords);
    console.log('Location changed:', coords);
  };

  const simulateAddressFill = () => {
    setTestAddress('Av. Paulista, 1578, São Paulo - SP, 01310-200');
    setAddressFilled(true);
    setMapCenter({
      latitude: -23.5613,
      longitude: -46.6565,
    });
  };

  const resetTest = () => {
    setTestAddress('');
    setAddressFilled(false);
    setMapCenter(undefined);
    setCoordinates(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Google Maps Integration Test
          </h1>
          <p className="text-neutral-400">
            Test the Google Maps component functionality and API integration
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Test Controls</h2>
          
          <div className="flex gap-4">
            <Button onClick={simulateAddressFill} variant="secondary">
              Simulate Address Fill (Av. Paulista)
            </Button>
            <Button onClick={resetTest} variant="outline">
              Reset Test
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Test Address:</label>
            <Input
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="Enter test address"
              className="bg-neutral-700 border-neutral-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">Address Filled:</span>
              <span className={`ml-2 ${addressFilled ? 'text-green-400' : 'text-red-400'}`}>
                {addressFilled ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">API Key Present:</span>
              <span className={`ml-2 ${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'text-green-400' : 'text-red-400'}`}>
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Google Maps Component */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Google Maps Component</h2>
          
          <GoogleMapsLocationPicker
            center={mapCenter}
            onLocationChange={handleLocationChange}
            addressFilled={addressFilled}
            addressString={testAddress}
          />
        </div>

        {/* Results */}
        {coordinates && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Selected Coordinates</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-neutral-400">Latitude:</span>
                <span className="ml-2 text-white font-mono">{coordinates.latitude.toFixed(8)}</span>
              </div>
              <div>
                <span className="text-neutral-400">Longitude:</span>
                <span className="ml-2 text-white font-mono">{coordinates.longitude.toFixed(8)}</span>
              </div>
              <div>
                <span className="text-neutral-400">Formatted:</span>
                <span className="ml-2 text-white font-mono">
                  {coordinates.latitude.toFixed(8)}, {coordinates.longitude.toFixed(8)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-neutral-400">Environment:</span>
              <span className="ml-2 text-white">{process.env.NODE_ENV}</span>
            </div>
            <div>
              <span className="text-neutral-400">Domain:</span>
              <span className="ml-2 text-white">{typeof window !== 'undefined' ? window.location.hostname : 'server-side'}</span>
            </div>
            <div>
              <span className="text-neutral-400">API Key (first 10 chars):</span>
              <span className="ml-2 text-white font-mono">
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
                  ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 10) + '...'
                  : 'Not configured'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-solar-900/20 border border-solar-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-solar-400 mb-4">Setup Instructions</h2>
          <div className="space-y-3 text-sm text-solar-300">
            <p>
              <strong>1. API Key:</strong> Make sure you have set <code className="bg-neutral-800 px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your <code>.env.local</code> file.
            </p>
            <p>
              <strong>2. API Restrictions:</strong> Ensure your Google Maps API key has the following APIs enabled:
            </p>
            <ul className="ml-4 space-y-1">
              <li>• Maps JavaScript API</li>
              <li>• Geocoding API</li>
              <li>• Places API (optional)</li>
            </ul>
            <p>
              <strong>3. Domain Restrictions:</strong> If you have domain restrictions on your API key, make sure to include:
            </p>
            <ul className="ml-4 space-y-1">
              <li>• localhost:3000 (for development)</li>
              <li>• Your production domain</li>
            </ul>
            <p>
              <strong>4. Test:</strong> Click "Simulate Address Fill" to test the component with a known address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}